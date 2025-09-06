import asyncio
from langchain.agents import tool
from pydantic import BaseModel, Field
import json
from typing import List

# وا دادەنێین کە web_search_tool.py لە هەمان فۆڵدەرە
from .web_search_tool import WebSearcher, SearxngProvider

class MultiWebSearchInput(BaseModel):
    queries: List[str] = Field(description="A list of search queries to execute in parallel.")

@tool
def multi_web_search(input_str: str) -> str:
    """
    Searches the web for multiple queries at the same time and returns the combined results.
    Use this when you need to gather information on several topics at once to be more efficient.
    The input MUST be a JSON string with one key: "queries", which is a list of strings.
    Example: {"queries": ["What is LangChain?", "Latest AI news"]}
    """
    try:
        parsed_input = json.loads(input_str)
        validated_input = MultiWebSearchInput(**parsed_input)
        queries = validated_input.queries
    except (json.JSONDecodeError, Exception) as e:
        return f"Error: Invalid input. Expected a JSON string with a 'queries' list. Details: {e}"

    ws = WebSearcher(SearxngProvider("http://localhost:8080"))
    
    async def _run_all_searches():
        tasks = [ws.run(query, pages=1, max_results=3) for query in queries]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        return results_list

    try:
        all_results = asyncio.run(_run_all_searches())
        
        output = ""
        for i, results in enumerate(all_results):
            query = queries[i]
            output += f"--- Results for query: '{query}' ---\n\n"
            if isinstance(results, Exception):
                output += f"An error occurred during this search: {results}\n\n"
                continue
            
            if not results:
                output += "No search results found for this query.\n\n"
                continue

            for item in results:
                title = item.title or "No Title"
                snippet = item.snippet or "No snippet available."
                url = item.url or "#"
                output += f"Title: {title}\nSnippet: {snippet}\nURL: {url}\n\n"
        
        return output.strip()
    except Exception as e:
        return f"An unexpected error occurred during multi-web search: {e}"