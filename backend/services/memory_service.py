import chromadb
from sentence_transformers import SentenceTransformer
import uuid
import os

# Initialize ChromaDB (runs in-process, no server needed)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Load embedding model (downloads once, cached after)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_collection(user_id: str):
    return chroma_client.get_or_create_collection(
        name=f"memory_{user_id}",
        metadata={"hnsw:space": "cosine"}
    )

def save_memory(user_id: str, text: str):
    collection = get_collection(user_id)
    embedding = embedding_model.encode(text).tolist()
    collection.add(
        documents=[text],
        embeddings=[embedding],
        ids=[str(uuid.uuid4())]
    )

def search_memory(user_id: str, query: str, top_k: int = 3) -> list:
    collection = get_collection(user_id)
    if collection.count() == 0:
        return []
    embedding = embedding_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(top_k, collection.count())
    )
    return results["documents"][0] if results["documents"] else []

def extract_and_save_memory(user_id: str, user_message: str, ai_response: str):
    # Save important user statements as memories
    important_keywords = [
        "my name is", "i am", "i work", "i like", "i hate",
        "i prefer", "i need", "i have", "i live", "my job",
        "my goal", "i study", "i want", "remember that"
    ]
    msg_lower = user_message.lower()
    if any(keyword in msg_lower for keyword in important_keywords):
        save_memory(user_id, f"User said: {user_message}")