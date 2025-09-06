from langchain.agents import tool
import json
import socket

BROWSER_SERVER_ADDRESS = ('127.0.0.1', 8001)

def _run_command(command: str, params: dict = None) -> str:
    try:
        payload = {"command": command, "params": params or {}}
        json_payload = json.dumps(payload)
        
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
            client_socket.settimeout(90)
            client_socket.connect(BROWSER_SERVER_ADDRESS)
            client_socket.sendall(json_payload.encode('utf-8'))
            
            response_data = b""
            while True:
                chunk = client_socket.recv(4096)
                if not chunk:
                    break
                response_data += chunk
            
            data = json.loads(response_data.decode('utf-8'))

            if data['status'] == 'success':
                return data['result']
            else:
                return f"Browser server error: {data['result']}"
    except socket.error as e:
        return f"Failed to connect to the browser server. Is it running? Error: {e}"
    except json.JSONDecodeError as e:
        return f"Error decoding response from browser server: {e}. Raw response: {response_data.decode('utf-8')}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"

@tool
def open_url(url: str) -> str:
    """Opens a URL in a browser. Must be used before other browser actions."""
    return _run_command("open_url", {"url": url})

@tool
def click_element(selector: str) -> str:
    """Clicks on an element specified by a CSS selector."""
    return _run_command("click_element", {"selector": selector})

@tool
def type_text(input_str: str) -> str:
    """
    Types text into an input field. The input MUST be a single string in the format: 
    "selector=YOUR_CSS_SELECTOR, text=THE_TEXT_TO_TYPE"
    """
    try:
        if ", text=" not in input_str:
            return "Error: Input for type_text must contain ', text='"
        selector_part, text_part = input_str.split(", text=", 1)
        if not selector_part.startswith("selector="):
            return "Error: Input for type_text must start with 'selector='"
        selector = selector_part.split("selector=", 1)[1]
        return _run_command("type_text", {"selector": selector, "text": text_part})
    except Exception as e:
        return f"Error parsing input for type_text: {e}"

@tool
def read_page_content() -> str:
    """Reads the cleaned text content of the current page."""
    return _run_command("read_page_content")

@tool
def list_interactive_elements() -> str:
    """
    Lists all interactive elements (links, buttons, inputs) on the current page.
    Use this to 'see' the page and find the correct CSS selectors before clicking or typing.
    """
    return _run_command("list_interactive_elements")

@tool
def close_browser() -> str:
    """Closes the browser instance. Should be used at the end of a session."""
    return _run_command("close_browser")