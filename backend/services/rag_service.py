import fitz  # pymupdf
import chromadb
from sentence_transformers import SentenceTransformer
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import uuid
import os

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\tesseract.exe"

# Poppler path
POPPLER_PATH = r"D:\colllege\Project\Hackathon\BOT\poppler-25.12.0\Library\bin"

chroma_client = chromadb.PersistentClient(path="./chroma_db")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_rag_collection(tenant_id: str):
    return chroma_client.get_or_create_collection(
        name=f"rag_{tenant_id}", 
        metadata={"hnsw:space": "cosine"}
    )

def extract_text_digital(file_path: str) -> str:
    """Extract text from digital/text-based PDF"""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()

def extract_text_ocr(file_path: str) -> str:
    """Extract text from scanned PDF using OCR"""
    print(f"Running OCR on {file_path}...")
    images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
    text = ""
    for i, image in enumerate(images):
        print(f"  OCR page {i+1}/{len(images)}")
        text += pytesseract.image_to_string(image) + "\n"
    return text.strip()

def extract_text_from_pdf(file_path: str) -> str:
    """Auto-detect: try digital first, fall back to OCR"""
    digital_text = extract_text_digital(file_path)

    # If less than 100 chars extracted, it's likely a scanned PDF
    if len(digital_text) < 100:
        print("Scanned PDF detected — switching to OCR...")
        return extract_text_ocr(file_path)

    print("Digital PDF detected — using direct extraction")
    return digital_text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def index_document(tenant_id: str, file_path: str, filename: str) -> int:
    collection = get_rag_collection(tenant_id)
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    for i, chunk in enumerate(chunks):
        embedding = embedding_model.encode(chunk).tolist()
        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"{filename}_{i}_{uuid.uuid4()}"],
            metadatas=[{"filename": filename, "chunk_index": i}]
        )
    return len(chunks)

def search_documents(tenant_id: str, query: str, top_k: int = 4) -> list:
    collection = get_rag_collection(tenant_id)
    if collection.count() == 0:
        return []
    embedding = embedding_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas"]
    )
    output = []
    if results["documents"]:
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            output.append({
                "content": doc,
                "filename": meta.get("filename", "unknown")
            })
    return output