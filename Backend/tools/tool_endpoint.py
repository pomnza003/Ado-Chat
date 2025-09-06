# tool_endpoint.py
from fastapi import APIRouter
from pydantic import BaseModel
from web_search_tool_v2 import WebSearcher, SearxngProvider
from reader_summarizer import synthesize_answer
import asyncio

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    mode: str = "general"   # "general" | "news"
    time_range: str | None = None  # "day"|"week"|"month"|"year"
    lang: str = "en"
    pages: int = 2
    max_results: int = 15
    summarize: bool = True

@router.post("/web_search")
async def web_search(req: SearchRequest):
    categories = "news" if req.mode=="news" else "general"
    ws = WebSearcher(SearxngProvider("http://localhost:8080"))
    hits = await ws.run(req.query, pages=req.pages, time_range=req.time_range,
                        categories=categories, lang=req.lang, max_results=req.max_results)
    if not req.summarize:
        return {"results": [h.__dict__ for h in hits]}
    syn = await synthesize_answer(req.query, hits)
    return {"results": [h.__dict__ for h in hits], "summary": syn["summary"], "sources": syn["sources"]}
