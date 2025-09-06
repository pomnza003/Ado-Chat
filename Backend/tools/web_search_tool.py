from __future__ import annotations
import re, json, math, asyncio, urllib.parse as up
from dataclasses import dataclass
from typing import List
from langchain.agents import tool

@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str
    score: float = 0.0
    raw: dict | None = None

class SearchProvider:
    async def search(self, query: str, *, page:int=1, time_range:str|None=None,
                     categories:str="general", lang:str="en") -> List[SearchResult]:
        raise NotImplementedError

class SearxngProvider(SearchProvider):
    def __init__(self, base_url: str = "http://localhost:8080"):
        import httpx
        self.base = base_url.rstrip("/")
        self.httpx = httpx

    async def search(self, query: str, *, page:int=1, time_range:str|None=None,
                     categories:str="general", lang:str="en") -> List[SearchResult]:
        params = {"q": query, "format": "json", "pageno": page,
                  "categories": categories, "language": lang}
        if time_range:
            params["time_range"] = time_range
        url = f"{self.base}/search?{up.urlencode(params)}"
        async with self.httpx.AsyncClient(timeout=10) as client:
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

TRACKING_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term","utm_content",
                   "gclid","fbclid","yclid","mc_cid","mc_eid"}

def normalize_url(u:str) -> str:
    try:
        p = up.urlparse(u)
        q = up.parse_qsl(p.query, keep_blank_values=True)
        q = [(k,v) for (k,v) in q if k not in TRACKING_PARAMS]
        newq = up.urlencode(q, doseq=True)
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

def bm25_like_score(q: str, text: str) -> float:
    q_terms = set(re.findall(r"\w+", q.lower()))
    words = re.findall(r"\w+", (text or "").lower())
    if not words: return 0.0
    match = sum(1 for w in words if w in q_terms)
    return match / math.sqrt(len(words))

def rerank(query: str, results: List[SearchResult]) -> List[SearchResult]:
    for r in results:
        text = f"{r.title} {r.snippet}"
        r.score = bm25_like_score(query, text)
    results.sort(key=lambda x: x.score, reverse=True)
    return results

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

@tool
def web_search(query: str) -> str:
    """
    Searches the web using the advanced WebSearcher and returns top results as a formatted string.
    Use this for questions about current events, prices, or general knowledge.
    """
    try:
        ws = WebSearcher(SearxngProvider("http://localhost:8080"))
        async def _run_search():
            return await ws.run(query, pages=1, max_results=5)
        
        results = asyncio.run(_run_search())

        if not results:
            return "No search results found."

        output = ""
        for item in results:
            title = item.title or "No Title"
            snippet = item.snippet or "No snippet available."
            url = item.url or "#"
            output += f"Title: {title}\nSnippet: {snippet}\nURL: {url}\n\n"
        return output.strip()
    except Exception as e:
        return f"An unexpected error occurred during web search: {e}"