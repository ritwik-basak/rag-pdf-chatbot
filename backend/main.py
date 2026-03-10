"""
FastAPI Backend for RAG PDF Chatbot
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from rag_engine import RAGEngine

load_dotenv()

app = FastAPI(title="RAG PDF Chatbot API")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG engine instance
rag: Optional[RAGEngine] = None


def get_rag() -> RAGEngine:
    global rag
    if rag is None:
        gemini_key     = os.getenv("GEMINI_API_KEY", "")
        pinecone_key   = os.getenv("PINECONE_API_KEY", "")
        pinecone_index = os.getenv("PINECONE_INDEX_NAME", "doc-chatbot")

        if not gemini_key or not pinecone_key:
            raise HTTPException(status_code=500, detail="API keys not configured in .env file")

        rag = RAGEngine(
            gemini_api_key=gemini_key,
            pinecone_api_key=pinecone_key,
            pinecone_index_name=pinecone_index,
        )
    return rag


# ── Models ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    chat_history: list = []


class QueryResponse(BaseModel):
    answer: str
    sources: list


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "RAG PDF Chatbot API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and index a PDF file."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        engine = get_rag()
        contents = await file.read()
        chunks = engine.index_pdf(contents, file.filename)
        return {
            "message": f"Successfully indexed {file.filename}",
            "filename": file.filename,
            "chunks": chunks,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """Ask a question about indexed documents."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        engine = get_rag()
        result = engine.query(request.question, chat_history=request.chat_history)
        return QueryResponse(answer=result["answer"], sources=result["sources"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
