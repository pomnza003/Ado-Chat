# 🤖 Ado Chat - Advanced AI Agent Framework

Ado Chat is a powerful, feature-rich chat interface for interacting with various large language models. It's built with a modern tech stack and designed to be an extensible framework for developing and experimenting with AI agents. Go beyond simple chat and leverage a suite of powerful tools, from web browsing and code execution to long-term memory.

---

### ✨ Live Demo


![Ado Chat Screenshot](https://raw.githubusercontent.com/Abdulkadir98/ado-chat-pro/main/Image/1.png)

![Ado Chat Screenshot](https://via.placeholder.com/800x500.png?text=Your+App+Screenshot+Here)

---

## 🚀 Key Features

*   **🔌 Multi-Backend Support**: Seamlessly switch between different model providers:
    *   **Ollama**: Run models locally for privacy and offline access.
    *   **Google AI Studio (Gemini)**: Leverage Google's powerful Gemini family of models.
    *   **NVIDIA AI Foundation**: Access cutting-edge models hosted by NVIDIA.
*   **🤖 Advanced Agent Mode**: Unleash the full potential of your AI with two powerful execution modes:
    *   **Single Agent**: A standard agent that uses tools to accomplish tasks.
    *   **Crew Mode**: A more advanced mode that uses a "Planner" agent to break down complex tasks and an "Executor" agent to complete each step, enabling more robust and complex problem-solving.
*   **🛠️ Rich Toolset**: Equip your agent with a wide range of capabilities:
    *   **Web Research**: Perform single or multiple parallel web searches, read web content intelligently, and summarize URLs.
    *   **File System**: List, read, and write files directly within a secure workspace.
    *   **Code Execution**: Run Python code in a persistent environment to perform calculations, data analysis, and more.
    *   **Long-term Memory**: Give your agent the ability to remember and recall information across conversations.
    *   **Interactive Browser**: (Experimental) Allow the agent to open URLs, click elements, and type text in a controlled browser environment.
*   **Modern UI/UX**:
    *   **Markdown & Code Highlighting**: Richly formatted messages for better readability.
    *   **Streaming Responses**: Get real-time feedback as the agent "thinks" and generates a response.
    *   **Agent Task Visualization**: Clearly see the agent's thought process, the tools it uses, and the results of each step.
    *   **Dark/Light Mode**: A sleek interface that adapts to your preference.
    *   **Conversation Management**: Easily create, manage, and delete multiple conversations.
*   **Secure & Local First**:
    *   All conversations and settings are saved directly in your browser's `localStorage`.
    *   The secure workspace ensures the agent can only access files within its designated directory.

---

## 🛠️ Tech Stack

This project is a monorepo containing both the frontend and backend services.

| Component | Technology/Library |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Marked, Highlight.js |
| **Backend** | Python, FastAPI, LangChain |
| **Models** | Ollama, Google Gemini, NVIDIA AI Foundation |
| **Vector DB** | LanceDB (for long-term memory) |
| **Browser Agent**| Playwright |

---

## ⚙️ Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   Node.js (v18 or later)
*   Python (v3.9 or later)
*   [Ollama](https://ollama.ai/) (for local model support)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ado-chat.git
cd ado-chat