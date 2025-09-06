# 🤖 Ado Chat - Frontend Interface

This is the frontend for Ado Chat, a modern and responsive user interface built with React and Tailwind CSS. It provides a seamless and intuitive experience for interacting with the powerful AI agent backend, visualizing its thought processes, and managing conversations.



---

## ✨ Features

-   **Sleek & Responsive UI**: A clean and modern interface built with **Tailwind CSS** that works beautifully on all screen sizes.
-   **Real-time Streaming**: Watch the agent "think" in real-time with streaming responses and step-by-step tool execution updates.
-   **Agent Configuration**: A dedicated panel to toggle Agent Mode, switch between execution strategies (Single Agent vs. Crew), and enable/disable specific tools.
-   **Rich Markdown & Code Rendering**: Messages are beautifully rendered with support for Markdown and syntax highlighting for code blocks.
-   **Conversation Management**: Easily create, switch between, and delete multiple conversation threads.
-   **Persistent State**: Conversations and settings are automatically saved to your browser's `localStorage`.
-   **Light & Dark Modes**: Switch between themes to match your preference.
-   **File Uploads**: Seamlessly upload files to the agent's secure workspace for analysis and manipulation.

---

## 🛠️ Tech Stack

| Category      | Technology / Library                                       |
| :------------ | :--------------------------------------------------------- |
| **Framework** | [React](https://reactjs.org/)                              |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/)                   |
| **State**     | React Hooks (`useState`, `useEffect`) & `localStorage`     |
| **Markdown**  | [Marked](https://marked.js.org/) & [Highlight.js](https://highlightjs.org/) |
| **Build Tool**| [Create React App](https://create-react-app.dev/)          |

---

## ⚙️ Getting Started

To run the frontend locally, follow these steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/ado-chat.git
    cd ado-chat/frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Backend Server**:
    The frontend requires the backend server to be running. Please follow the instructions in the `backend/README.md` to start the backend server, which runs on port `8000` by default.

4.  **Start the Frontend Development Server**:
    ```bash
    npm start
    ```
    This will open the application in your browser at `http://localhost:3000`.

---

## scripts berdest in

-   `npm start`: Runs the app in development mode.
-   `npm test`: Launches the test runner in interactive watch mode.
-   `npm run build`: Builds the app for production to the `build` folder.
-   `npm run eject`: Ejects the app from Create React App's managed configuration.

---

## 🔗 Connecting to the Backend

The API endpoint is configured in `src/components/ChatView.js`. By default, it is set to `http://127.0.0.1:8000`. If you run the backend on a different port, you will need to update this file.