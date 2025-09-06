from .filesystem_tools import list_files, write_file, read_file
from .web_search_tool import web_search
from .multi_web_search_tool import multi_web_search
from .python_executor_tool import python_executor
from .intelligent_web_reader_tool import intelligent_web_reader
from .summarize_urls_tool import summarize_urls # زیادکرا
from .memory_tools import remember_this, recall_memory
from .interactive_browser_tools import (
    open_url, 
    click_element, 
    type_text, 
    read_page_content, 
    list_interactive_elements,
    close_browser
)
import datetime
from langchain.agents import tool

@tool
def get_current_time() -> str:
    """Returns the current date and time as a string."""
    return f"The current date and time is {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}."

all_tools = [
    get_current_time,
    web_search,
    multi_web_search,
    intelligent_web_reader,
    summarize_urls, # زیادکرا
    list_files,
    write_file,
    read_file,
    python_executor,
    remember_this,
    recall_memory,
    open_url,
    click_element,
    type_text,
    read_page_content,
    list_interactive_elements,
    close_browser,
]

tool_map = {tool.name: tool for tool in all_tools}