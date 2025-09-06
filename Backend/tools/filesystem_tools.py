import os
from langchain.agents import tool
from pydantic import BaseModel, Field, ValidationError
import json

WORKSPACE_DIR = "agent_workspace"
if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

def _is_safe_path(path: str) -> bool:
    base_path = os.path.abspath(WORKSPACE_DIR)
    resolved_path = os.path.abspath(os.path.join(base_path, path))
    return resolved_path.startswith(base_path)

@tool
def list_files(directory: str = ".") -> str:
    """Lists all files and directories in a specified directory within the workspace."""
    if not _is_safe_path(directory):
        return "Error: Access denied."
    try:
        path = os.path.join(WORKSPACE_DIR, directory)
        files = os.listdir(path)
        return "\n".join(files) if files else "Directory is empty."
    except Exception as e:
        return f"An error occurred: {e}"

class ReadFileInput(BaseModel):
    filename: str = Field(description="The path to the file to read from, relative to the workspace.")

@tool
def read_file(input_str: str) -> str:
    """
    Reads the content of a file from the workspace.
    The input MUST be a JSON string with one key: "filename".
    Example: {"filename": "my_notes.txt"}
    """
    try:
        parsed_input = json.loads(input_str)
        validated_input = ReadFileInput(**parsed_input)
        filename = validated_input.filename
    except (json.JSONDecodeError, ValidationError) as e:
        return f"Error: Invalid input schema for read_file tool. Expected JSON with 'filename' key. Details: {e}"
    
    if not _is_safe_path(filename):
        return "Error: Access denied."
    try:
        path = os.path.join(WORKSPACE_DIR, filename)
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return f"Error: File '{filename}' not found."
    except Exception as e:
        return f"An error occurred while reading the file: {e}"

class WriteFileInput(BaseModel):
    filename: str = Field(description="The path to the file to write to, relative to the workspace.")
    content: str = Field(description="The content to write into the file.")

@tool
def write_file(input_str: str) -> str:
    """
    Writes content to a specific file in the workspace.
    The input MUST be a JSON string with two keys: "filename" and "content".
    Example: {"filename": "my_notes.txt", "content": "This is my note."}
    """
    try:
        parsed_input = json.loads(input_str)
        validated_input = WriteFileInput(**parsed_input)
        filename = validated_input.filename
        content = validated_input.content
    except (json.JSONDecodeError, ValidationError) as e:
        return f"Error: Invalid input schema for write_file tool. Details: {e}"

    if not _is_safe_path(filename):
        return "Error: Access denied. You can only write files within the workspace."
    
    try:
        path = os.path.join(WORKSPACE_DIR, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote content to '{filename}'."
    except Exception as e:
        return f"An error occurred while writing to file: {e}"