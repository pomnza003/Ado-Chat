import asyncio
import sys
import json
import os
import re
import traceback
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List, Any
from langchain_ollama.llms import OllamaLLM
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import AIMessage

from tools import tool_map

AISTUDIO_DELAY_SECONDS = 15

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def extract_json_from_string(text: str) -> Optional[dict]:
    match = re.search(r'```json\s*(\{.*\}|\[.*\])\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    try:
        start_brace = text.find('[')
        start_curly = text.find('{')
        
        if start_brace == -1 and start_curly == -1:
            return None

        if start_brace != -1 and (start_brace < start_curly or start_curly == -1):
            start = start_brace
            end = text.rfind(']')
        else:
            start = start_curly
            end = text.rfind('}')
            
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json.loads(json_str)
            
    except json.JSONDecodeError:
        pass

    return None

class StreamCallbackHandler(BaseCallbackHandler):
    def __init__(self, queue: asyncio.Queue, prefix: str = ""):
        self.queue = queue
        self.prefix = prefix
        self.task_counter = 0

    def send_event(self, event_type: str, data: dict):
        event_name = f"{self.prefix}_{event_type}" if self.prefix else event_type
        self.queue.put_nowait(json.dumps({"event": event_name, "data": data}))

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        self.task_counter += 1
        thought = kwargs.get('log', '').split("Thought:")[-1].split("Action:")[0].strip()
        self.send_event("task_start", {"id": self.task_counter, "thought": thought, "tool": action.tool, "input": action.tool_input})

    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        self.send_event("task_end", {"id": self.task_counter, "output": output})
        
    def on_tool_error(self, error: Exception, **kwargs: Any) -> Any:
        self.send_event("task_error", {"id": self.task_counter, "error": str(error)})

PLANNER_PROMPT_TEMPLATE = """
You are a master project planner. Your job is to take a user's request and break it down into a series of simple, sequential, and logical steps.
Each step should be a clear instruction for another AI agent to follow.
The final step should always be to synthesize all the gathered information and provide a final answer to the user.
You have access to the following tools that the executor agent can use: {tool_names}
Analyze the user's request and create a JSON array of tasks. Each task must have two keys:
1. "step": A short, descriptive title for the task (e.g., "Research EV Market Trends").
2. "task": A detailed, clear, and specific instruction for the executor agent. Tell it exactly what to do and which tools to use.
Your output MUST be ONLY the raw JSON array, without any other text or markdown.

User Request: {input}
Your JSON Plan:
"""

EXECUTOR_PROMPT_TEMPLATE = """
You are a diligent executor agent. Your only goal is to complete the single task assigned to you.
You must use the provided tools to accomplish your task.
You have access to the context and results from previous steps.

Previous Steps' Results:
{context}

Your Assigned Task:
{task}

You have access to the following tools:
{tools}

Use the following format:

Thought: You should always think about what to do to complete your assigned task.
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I have now completed my assigned task.
Final Answer: A summary of what you did and the direct result of your work. This result will be passed to the next step.

Begin!

{agent_scratchpad}
"""

FINAL_ANSWER_PROMPT_TEMPLATE = """
You are a summarizer agent. You have been given the results of a multi-step execution plan.
Your job is to synthesize all the information from the previous steps into a single, comprehensive, and well-formatted final answer for the user.
Do not describe the steps taken. Only provide the final, complete answer to the original user request.

Results from all steps:
{context}

Provide the final answer now:
"""

react_prompt_template = """
You are a helpful AI assistant. Answer the user's request directly.
You have access to the following tools:
{tools}

Use the following format:
Question: the input question you must answer
Thought: You should always think about what to do. Your thought process should be detailed and explain your reasoning for the chosen action.
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer based on my plan and observations.
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
"""

app = FastAPI(title="Advanced Modular Agent Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

WORKSPACE_DIR = "agent_workspace"
if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

class ChatRequest(BaseModel):
    prompt: str
    backend: str
    mode: Optional[str] = "agent"
    enabled_tools: List[str]
    model_name: Optional[str] = None
    api_key: Optional[str] = None

def get_llm(backend: str, model_name: Optional[str], api_key: Optional[str] = None):
    if backend == 'ollama':
        return OllamaLLM(model=model_name)
    elif backend == 'aistudio':
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required for Google AI Studio.")
        return ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.1)
    elif backend == 'nvidia':
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required for NVIDIA.")
        return ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base="https://integrate.api.nvidia.com/v1",
            temperature=0.1,
            streaming=False
        )
    raise HTTPException(status_code=400, detail="Unsupported backend.")

async def agent_streamer(request: ChatRequest, llm: Any, queue: asyncio.Queue):
    callback_handler = StreamCallbackHandler(queue)
    try:
        if request.backend == 'aistudio':
            await asyncio.sleep(AISTUDIO_DELAY_SECONDS)
            
        active_tools = [tool_map[name] for name in request.enabled_tools if name in tool_map]
        prompt_template = PromptTemplate.from_template(react_prompt_template)
        agent = create_react_agent(llm, active_tools, prompt_template)
        agent_executor = AgentExecutor(
            agent=agent, tools=active_tools, verbose=True, 
            handle_parsing_errors="Check your output and make sure it conforms to the format!", 
            max_iterations=15, callbacks=[callback_handler]
        )
        result = await agent_executor.ainvoke({"input": request.prompt, "tools": active_tools, "tool_names": ", ".join([t.name for t in active_tools])})
        await queue.put(json.dumps({"event": "final_answer", "data": {"reply": result.get("output", "Could not process.")}}))
    except Exception as e:
        traceback.print_exc()
        await queue.put(json.dumps({"event": "error", "data": {"message": f"An agent error occurred: {str(e)}"}}))
    finally:
        await queue.put(None)

async def crew_streamer(request: ChatRequest, llm: Any, queue: asyncio.Queue):
    try:
        active_tools = [tool_map[name] for name in request.enabled_tools if name in tool_map]
        tool_names = ", ".join([t.name for t in active_tools])

        planner_prompt = PromptTemplate.from_template(PLANNER_PROMPT_TEMPLATE).format(
            input=request.prompt, tool_names=tool_names
        )
        planner_llm = get_llm(request.backend, request.model_name, request.api_key)
        
        if request.backend == 'aistudio':
            await asyncio.sleep(AISTUDIO_DELAY_SECONDS)
            
        planner_response = await planner_llm.ainvoke(planner_prompt)
        plan_str = planner_response.content if isinstance(planner_response, AIMessage) else str(planner_response)
        
        plan = extract_json_from_string(plan_str)
        if not plan or not isinstance(plan, list):
            await queue.put(json.dumps({"event": "error", "data": {"message": f"Planner failed to generate a valid JSON plan. Raw response: {plan_str}"}}))
            return

        await queue.put(json.dumps({"event": "crew_plan", "data": {"plan": plan}}))

        context = ""
        for i, step in enumerate(plan):
            await queue.put(json.dumps({"event": "crew_step_start", "data": {"index": i, "step": step.get("step")}}))
            
            executor_prompt = PromptTemplate.from_template(EXECUTOR_PROMPT_TEMPLATE)
            executor_agent = create_react_agent(llm, active_tools, executor_prompt)
            agent_executor = AgentExecutor(
                agent=executor_agent, tools=active_tools, verbose=True,
                handle_parsing_errors=True, max_iterations=10,
                callbacks=[StreamCallbackHandler(queue, prefix="crew_task")]
            )
            
            if request.backend == 'aistudio':
                await asyncio.sleep(AISTUDIO_DELAY_SECONDS)
            
            result = await agent_executor.ainvoke({"task": step.get("task"), "context": context, "tools": active_tools, "tool_names": tool_names})
            step_output = result.get("output", f"Step {i+1} failed.")
            
            context += f"Step {i+1} ({step.get('step')}):\n{step_output}\n\n"
            await queue.put(json.dumps({"event": "crew_step_end", "data": {"index": i, "result": step_output}}))

        final_prompt = PromptTemplate.from_template(FINAL_ANSWER_PROMPT_TEMPLATE).format(context=context)
        final_llm = get_llm(request.backend, request.model_name, request.api_key)
        
        if request.backend == 'aistudio':
            await asyncio.sleep(AISTUDIO_DELAY_SECONDS)
            
        final_answer_obj = await final_llm.ainvoke(final_prompt)
        final_answer = final_answer_obj.content if isinstance(final_answer_obj, AIMessage) else str(final_answer_obj)
        
        await queue.put(json.dumps({"event": "final_answer", "data": {"reply": final_answer}}))

    except Exception as e:
        traceback.print_exc()
        await queue.put(json.dumps({"event": "error", "data": {"message": f"A crew error occurred: {str(e)}"}}))
    finally:
        await queue.put(None)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(WORKSPACE_DIR, safe_filename)

    if not os.path.abspath(file_path).startswith(os.path.abspath(WORKSPACE_DIR)):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": safe_filename, "message": "File uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

@app.post("/agent-chat")
async def chat_with_agent(request: ChatRequest):
    llm = get_llm(request.backend, request.model_name, request.api_key)
    
    async def event_stream():
        queue = asyncio.Queue()
        task = None
        if request.mode == "crew":
            task = asyncio.create_task(crew_streamer(request, llm, queue))
        else:
            task = asyncio.create_task(agent_streamer(request, llm, queue))
        
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {item}\n\n"
        await task

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/workspace/{filename}")
async def get_workspace_file(filename: str):
    workspace_dir = "agent_workspace"
    file_path = os.path.join(workspace_dir, filename)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}

print("Advanced Modular Agent server is running on http://127.0.0.1:8000")