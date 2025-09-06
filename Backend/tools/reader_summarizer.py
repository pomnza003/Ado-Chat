# reader_summarizer.py
import httpx, trafilatura
from typing import List
from web_search_tool_v2 import SearchResult, normalize_url

async def fetch_clean_text(url:str, timeout:int=12) -> str|None:
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent":"Mozilla/5.0"}) as c:
        r = await c.get(url)
        r.raise_for_status()
        return trafilatura.extract(r.text, include_comments=False, include_tables=False)

def build_citation(url:str, title:str)->str:
    return f"[{title or url}]({normalize_url(url)})"

async def synthesize_answer(query:str, hits:List[SearchResult], max_docs:int=5) -> dict:
    docs = []
    for r in hits[:max_docs]:
        text = await fetch_clean_text(r.url) or r.snippet
        docs.append({"title": r.title, "url": r.url, "text": text[:6000]})
    # Here call your LLM (any provider) to summarize docs into an answer with bullet points + citations.
    # Placeholder:
    bullets = []
    for d in docs:
        if not d["text"]: continue
        bullets.append(f"• {d['text'][:220].splitlines()[0]} … {build_citation(d['url'], d['title'])}")
    return {"summary": "\n".join(bullets), "sources": [d["url"] for d in docs]}
