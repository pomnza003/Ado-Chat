import lancedb
from langchain.agents import tool
from langchain_huggingface import HuggingFaceEmbeddings
from lancedb.pydantic import LanceModel, Vector
import datetime
import os

db_path = "agent_memory_db"
if not os.path.exists(db_path):
    os.makedirs(db_path)
    
db = lancedb.connect(db_path)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
EMBEDDING_DIMENSION = len(embeddings.embed_query("test query"))

class MemorySchema(LanceModel):
    text: str
    timestamp: str
    vector: Vector(EMBEDDING_DIMENSION)

try:
    table = db.open_table("agent_memory")
except ValueError:
    table = db.create_table("agent_memory", schema=MemorySchema, mode="overwrite")

@tool
def remember_this(fact: str) -> str:
    """
    Saves a piece of information or a fact to the agent's long-term memory.
    Use this to remember user preferences, key facts, or important details from conversations.
    """
    try:
        timestamp = datetime.datetime.now().isoformat()
        vector = embeddings.embed_query(fact)
        data = MemorySchema(text=fact, timestamp=timestamp, vector=vector)
        table.add([data])
        return f"Successfully remembered: '{fact}'"
    except Exception as e:
        return f"Error while trying to remember: {e}"

@tool
def recall_memory(query: str) -> str:
    """
    Searches the agent's long-term memory for information relevant to a query.
    Use this before starting a complex task to see if you already know something useful.
    """
    try:
        query_vector = embeddings.embed_query(query)
        results = table.search(query_vector).limit(3).to_pydantic(MemorySchema)
        if not results:
            return "I don't have any relevant memories for that query."
        
        recalled = "\n".join(f"- {mem.text} (Recalled from {mem.timestamp})" for mem in results)
        return f"Here are my relevant memories:\n{recalled}"
    except Exception as e:
        return f"Error while trying to recall memories: {e}"