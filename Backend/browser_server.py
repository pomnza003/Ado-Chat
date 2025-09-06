import socket
import json
from playwright.sync_api import sync_playwright

HOST = '127.0.0.1'
PORT = 8001

def handle_request(conn, page):
    data = conn.recv(4096).decode()
    if not data:
        return
    try:
        request = json.loads(data)
        command = request.get("command")
        params = request.get("params", {})
        result_data = {}
        if command == 'open_url':
            url = params['url']
            page.goto(url, timeout=60000)
            result_data = {"status": "success", "result": f"Page '{url}' opened."}
        elif command == 'list_interactive_elements':
            elements = page.locator("a, button, input, textarea, select").all()
            items = []
            for el in elements:
                try:
                    items.append({
                        "tag": el.evaluate("el => el.tagName"),
                        "text": el.inner_text(timeout=1000)[:100],
                        "id": el.get_attribute("id"),
                        "name": el.get_attribute("name")
                    })
                except:
                    continue
            result_data = {"status": "success", "result": items}
        elif command == 'click_element':
            selector = params['selector']
            page.click(selector, timeout=30000)
            result_data = {"status": "success", "result": f"Clicked '{selector}'."}
        elif command == 'type_text':
            selector = params['selector']
            text = params['text']
            page.fill(selector, text, timeout=30000)
            result_data = {"status": "success", "result": f"Typed '{text}' into '{selector}'."}
        elif command == 'read_page_content':
            content = page.content()
            result_data = {"status": "success", "result": content[:5000]}
        elif command == 'close_browser':
            result_data = {"status": "success", "result": "Browser closed."}
            conn.sendall(json.dumps(result_data).encode())
            conn.close()
            return False
        conn.sendall(json.dumps(result_data).encode())
    except Exception as e:
        error_data = {"status": "error", "message": str(e)}
        conn.sendall(json.dumps(error_data).encode())
    return True

def start_server():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        print(f"Browser Interaction Server is running on http://{HOST}:{PORT}")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((HOST, PORT))
            s.listen()
            while True:
                conn, addr = s.accept()
                with conn:
                    if not handle_request(conn, page):
                        break
        browser.close()

if __name__ == "__main__":
    start_server()