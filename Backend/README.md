# 🤖 Ado Chat - Backend Agent Server

This is the backend for Ado Chat, the intelligent core that powers the entire application. Built with Python, FastAPI, and LangChain, this server provides a robust and extensible framework for creating powerful AI agents.

---

## 🏛️ Architecture Overview

The backend is composed of two main services:

1.  **Agent Server (`agent_server.py`)**: A FastAPI server that exposes endpoints for chat, file uploads, and managing the agent's workspace. It orchestrates the agent's logic, tool usage, and communication with various LLM backends.
2.  **Browser Server (`browser_server.py`)**: A dedicated Python server using Playwright to provide a controlled, interactive browser instance that the agent can command.

```
┌──────────────┐      ┌─────────────────────┐      ┌─────────────────────────┐
│ React Frontend │ ───> │   FastAPI Agent Server  │ ───> │   LLM Backends        │
│ (localhost:3000) │      │   (localhost:8000)      │      │ (Ollama, Google, NVIDIA)│
└──────────────┘      └───────────┬─────────┘      └─────────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │          Tools Module         │
                  │ ┌───────────┐ ┌───────────┐   │
                  │ │ Web Search│ │ File I/O  │...│
                  │ └───────────┘ └───────────┘   │
                  │               │               │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────▼───────────────┐
                  │ Browser Server (Playwright)   │
                  │      (localhost:8001)         │
                  └───────────────────────────────┘
```

---

## ✨ Key Features

-   **🔌 Multi-Backend LLM Integration**: Dynamically switch between:
    -   **Ollama**: For running local models.
    -   **Google AI Studio**: For Gemini models.
    -   **NVIDIA AI Foundation**: For NVIDIA-hosted models.
-   **🤖 Dual Agent Architectures**:
    -   **React Agent Mode**: A standard, single-agent approach for straightforward tasks.
    -   **Crew Mode**: A powerful multi-agent system where a "Planner" agent creates a step-by-step plan and an "Executor" agent carries out each task.
-   **🛠️ Modular & Extensible Tool System**: A comprehensive set of tools, including:
    -   **Web Research**: Single and parallel web search, intelligent content reading, and URL summarization.
    -   **File System**: Securely list, read, and write files within a dedicated `agent_workspace` directory.
    -   **Python Executor**: A stateful Python REPL for code execution.
    -   **Long-Term Memory**: Utilizes **LanceDB** for persistent, vector-based memory.
    -   **Interactive Browser**: Opens URLs, clicks elements, and types text via the Playwright-based browser server.
-   **⚡ Streaming API**: Uses Server-Sent Events (SSE) to stream the agent's thought process, tool usage, and final answer to the frontend in real-time.
-   **📁 Secure Workspace**: All file operations are restricted to the `agent_workspace` directory to prevent unintended access to the host system.

---

## 🛠️ Tech Stack

| Category      | Technology / Library                                       |
| :------------ | :--------------------------------------------------------- |
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/)                   |
| **Agent Logic**| [LangChain](https://www.langchain.com/)                    |
| **LLM Support**| `langchain-ollama`, `langchain-google-genai`, `langchain-openai` |
| **Vector DB** | [LanceDB](https://lancedb.com/)                            |
| **Web Browsing**| [Playwright](https://playwright.dev/)                   |
| **Web Scraping**| [Trafilatura](https://trafilatura.readthedocs.io/)       |
| **Local Search**| [SearXNG](https://docs.searxng.org/) (recommended)      |

---

## ⚙️ Getting Started

### Prerequisites

-   Python (v3.9 or later)
-   A package manager like `pip` or `poetry`.
-   **SearXNG**: For the `web_search` tool to function, you need a running instance of SearXNG. You can easily run it with Docker:
    ```bash
    docker run -d --name searxng -p 8080:8080 searxng/searxng
    ```
-   **Ollama**: Install from [ollama.ai](https://ollama.ai/) and pull a model (e.g., `ollama pull llama3`).

### Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/ado-chat.git
    cd ado-chat/backend # Or your backend folder name
    ```

2.  **Create a Virtual Environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    *(Note: Create a `requirements.txt` file from your project's dependencies first)*
    ```bash
    pip install -r requirements.txt
    playwright install # Installs necessary browser binaries
    ```

4.  **Run the Servers**:
    You need to run both the agent server and the browser server in separate terminal windows.

    *Terminal 1: Start the Agent Server*
    ```bash
    uvicorn agent_server:app --reload --port 8000
    ```

    *Terminal 2: Start the Browser Server*
    ```bash
    python browser_server.py
    ```
    Your backend is now ready and listening for requests from the frontend.

---

##  API Endpoints

-   `POST /agent-chat`: The main endpoint for sending prompts to the agent. It accepts a JSON payload and returns a `text/event-stream` response.
-   `POST /upload`: Handles file uploads to the `agent_workspace`.
-   `GET /workspace/{filename}`: Serves files from the `agent_workspace`.

---

## 📝 Adding a New Tool

The framework is designed to be easily extensible. To add a new tool:

1.  Create a new Python file in the `tools/` directory (e.g., `my_new_tool.py`).
2.  Define your function and decorate it with LangChain's `@tool` decorator. Ensure it has a clear docstring, as this is what the agent uses to understand its function.
3.  Import your new tool in `tools/__init__.py`.
4.  Add the tool to the `all_tools` list and the `tool_map` dictionary in the same `__init__.py` file.
5.  Finally, add the tool's ID and label to the `ALL_TOOLS` object in the frontend file `frontend/src/lib/tools.js` to make it visible in the UI.