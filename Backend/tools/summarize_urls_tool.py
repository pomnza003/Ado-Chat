import asyncio
from langchain.agents import tool
from pydantic import BaseModel, Field
import json
from typing import List

# ئێمە لۆجیکی ناو intelligent_web_reader هاوردە دەکەین
from .intelligent_web_reader_tool import _get_cleaned_text_from_url, text_splitter, embeddings
from langchain_community.vectorstores import FAISS

class SummarizeUrlsInput(BaseModel):
    urls: List[str] = Field(description="A list of URLs to read and summarize.")
    question: str = Field(description="The specific question to find answers for across all webpages.")

async def _read_and_summarize_one_url(url: str, question: str) -> str:
    """Async helper to read and get relevant parts of a single URL."""
    try:
        content = await asyncio.to_thread(_get_cleaned_text_from_url, url)
        if not content:
            return f"Could not retrieve content from {url}."

        docs = await asyncio.to_thread(text_splitter.create_documents, [content])
        if not docs:
            return f"Content from {url} was empty after cleaning."
            
        vector_store = await asyncio.to_thread(FAISS.from_documents, docs, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 2})
        relevant_docs = await asyncio.to_thread(retriever.invoke, question)
        
        relevant_text = "\n".join([doc.page_content for doc in relevant_docs])
        return f"Summary from {url}:\n{relevant_text}\n"
    except Exception as e:
        return f"Error processing {url}: {str(e)}\n"

@tool
def summarize_urls(input_str: str) -> str:
    """
    Reads and summarizes the content of multiple webpages based on a specific question.
    Use this to efficiently gather information from several sources at once.
    The input MUST be a JSON string with two keys: "urls" (a list of strings) and "question".
    Example: {"urls": ["http://example.com/page1", "http://example.com/page2"], "question": "What is the main topic?"}
    """
    try:
        parsed_input = json.loads(input_str)
        validated_input = SummarizeUrlsInput(**parsed_input)
        urls = validated_input.urls
        question = validated_input.question
    except (json.JSONDecodeError, Exception) as e:
        return f"Error: Invalid input. Expected JSON with 'urls' list and 'question' string. Details: {e}"

    async def _run_all_summaries():
        tasks = [_read_and_summarize_one_url(url, question) for url in urls]
        results = await asyncio.gather(*tasks)
        return "\n---\n".join(results)

    try:
        summary = asyncio.run(_run_all_summaries())
        return f"Combined summary for the question '{question}':\n\n{summary}"
    except Exception as e:
        return f"An unexpected error occurred during URL summarization: {e}"