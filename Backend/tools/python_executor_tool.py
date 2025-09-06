from langchain.agents import tool
import io
import sys
from contextlib import redirect_stdout

persistent_globals = {}

def _clean_python_code(code: str) -> str:
    if code.strip().startswith("```python"):
        code = code.strip()[9:]
        if code.strip().endswith("```"):
            code = code.strip()[:-3]
    elif code.strip().startswith("```"):
        code = code.strip()[3:]
        if code.strip().endswith("```"):
            code = code.strip()[:-3]
    return code.strip()

@tool
def python_executor(code: str) -> str:
    """
    Executes Python code in a persistent environment and returns the output.
    This tool automatically cleans markdown formatting from the code.
    Variables, functions, and imports are remembered across calls.
    """
    cleaned_code = _clean_python_code(code)
    output_capture = io.StringIO()
    try:
        with redirect_stdout(output_capture):
            exec(cleaned_code, persistent_globals)
        
        output = output_capture.getvalue()
        if not output:
            return "Code executed successfully with no direct output."
        return f"Output:\n{output}"
    except Exception as e:
        return f"Error executing Python code: {type(e).__name__}: {e}"