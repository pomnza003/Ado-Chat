import requests
from bs4 import BeautifulSoup
from langchain.agents import tool
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import json
from pydantic import BaseModel, Field, ValidationError

class IntelligentWebReaderInput(BaseModel):
    url: str = Field(description="The URL of the webpage to read.")
    question: str = Field(description="The specific question to find answers for within the webpage.")

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150, length_function=len)

# ئەم فانکشنە وەک خۆی دەمێنێتەوە
def _get_cleaned_text_from_url(url: str) -> str:
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        for script_or_style in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            script_or_style.decompose()
        text = soup.get_text(separator='\n', strip=True)
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return '\n'.join(chunk for chunk in chunks if chunk)
    except Exception:
        return ""

@tool
def intelligent_web_reader(input_str: str) -> str:
    """
    Reads a single webpage's content to find relevant parts for a specific question.
    The input MUST be a JSON string with two keys: "url" and "question".
    Example: {"url": "https://example.com", "question": "What is the main topic?"}
    """
    try:
        parsed_input = json.loads(input_str)
        validated_input = IntelligentWebReaderInput(**parsed_input)
        url = validated_input.url
        question = validated_input.question
    except (json.JSONDecodeError, ValidationError) as e:
        return f"Error: Invalid input. Expected a JSON string with 'url' and 'question' keys. Details: {e}"

    content = _get_cleaned_text_from_url(url)
    if not content:
        return f"Error: Could not retrieve or read content from the URL: {url}"

    docs = text_splitter.create_documents([content])
    if not docs:
        return "Error: The content was empty after cleaning."

    try:
        vector_store = FAISS.from_documents(docs, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})
        relevant_docs = retriever.invoke(question)
        relevant_text = "\n\n---\n\n".join([doc.page_content for doc in relevant_docs])
        return f"Based on the content from {url}, here are the most relevant sections for '{question}':\n\n{relevant_text}"
    except Exception as e:
        return f"An error occurred during the analysis: {e}"