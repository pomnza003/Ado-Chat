# web_search_tool_v2.py
from __future__ import annotations
import re, json, math, hashlib, asyncio, urllib.parse as up
from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Tuple
import httpx

# --------- Result schema
@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str
    score: float = 0.0   # provider score or rerank score
    raw: Dict[str, Any] | None = None

# --------- Provider Strategy
class SearchProvider:
    async def search(self, query: str, *, page:int=1, time_range:str|None=None,
                     categories:str="general", lang:str="en") -> List[SearchResult]:
        raise NotImplementedError

# --------- SearXNG Provider
class SearxngProvider(SearchProvider):
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base = base_url.rstrip("/")

    async def search(self, query: str, *, page:int=1, time_range:str|None=None,
                     categories:str="general", lang:str="en") -> List[SearchResult]:
        params = {"q": query, "format": "json", "pageno": page,
                  "categories": categories, "language": lang}
        if time_range:
            params["time_range"] = time_range  # day|week|month|year
        url = f"{self.base}/search?{up.urlencode(params)}"
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
        out = []
        for it in data.get("results", []):
            out.append(SearchResult(
                title=it.get("title",""),
                url=it.get("url",""),
                snippet=it.get("content","") or it.get("snippet",""),
                source=it.get("engine","searxng"),
                raw=it
            ))
        return out

# --------- Utilities
TRACKING_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term","utm_content",
                   "gclid","fbclid","yclid","mc_cid","mc_eid"}

def normalize_url(u:str) -> str:
    try:
        p = up.urlparse(u)
        q = up.parse_qsl(p.query, keep_blank_values=True)
        q = [(k,v) for (k,v) in q if k not in TRACKING_PARAMS]
        newq = up.urlencode(q, doseq=True)
        # strip fragments
        norm = up.urlunparse((p.scheme, p.netloc.lower(), p.path, "", newq, ""))
        return norm
    except Exception:
        return u

def dedupe(results: List[SearchResult]) -> List[SearchResult]:
    seen = set(); out=[]
    for r in results:
        key = normalize_url(r.url)
        if key in seen: 
            continue
        seen.add(key); out.append(r)
    return out

# --------- Simple lexical rerank (placeholder)
def bm25_like_score(q: str, text: str) -> float:
    q_terms = set(re.findall(r"\w+", q.lower()))
    words = re.findall(r"\w+", (text or "").lower())
    if not words: return 0.0
    match = sum(1 for w in words if w in q_terms)
    return match / math.sqrt(len(words))

def rerank(query: str, results: List[SearchResult], *, top_k_llm:int=10) -> List[SearchResult]:
    for r in results:
        text = f"{r.title} {r.snippet}"
        r.score = bm25_like_score(query, text)
    results.sort(key=lambda x: x.score, reverse=True)
    # (Optional) plug LLM reranker here over top_k_llm
    return results

# --------- Orchestrator
class WebSearcher:
    def __init__(self, provider: SearchProvider):
        self.p = provider

    async def run(self, query: str, *, pages:int=2, time_range:str|None=None,
                  categories:str="general", lang:str="en", max_results:int=20) -> List[SearchResult]:
        tasks = [self.p.search(query, page=i+1, time_range=time_range,
                               categories=categories, lang=lang) for i in range(pages)]
        all_res = (await asyncio.gather(*tasks))
        flat = [x for sub in all_res for x in sub]
        flat = dedupe(flat)
        flat = rerank(query, flat)
        return flat[:max_results]
