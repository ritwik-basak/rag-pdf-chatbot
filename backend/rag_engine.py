"""
RAG Engine
----------
PDF ingestion  ->  chunking (LangChain RecursiveCharacterTextSplitter)
              ->  Gemini embeddings (gemini-embedding-001)  ->  Pinecone vector store
Query          ->  embed question  ->  retrieve top-k chunks
              ->  Gemini 2.5 Flash LLM  ->  answer + source citations
"""

import io
import re

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader


class RAGEngine:

    EMBED_MODEL   = "models/gemini-embedding-001"   # 3072 dimensions
    LLM_MODEL     = "gemini-2.5-flash"
    CHUNK_SIZE    = 1000
    CHUNK_OVERLAP = 150
    TOP_K         = 5

    def __init__(self, gemini_api_key: str, pinecone_api_key: str, pinecone_index_name: str):
        self.index_name = pinecone_index_name

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.EMBED_MODEL,
            google_api_key=gemini_api_key,
        )

        self.llm = ChatGoogleGenerativeAI(
            model=self.LLM_MODEL,
            google_api_key=gemini_api_key,
            temperature=0.2,
        )

        pc = Pinecone(api_key=pinecone_api_key)
        existing = [idx.name for idx in pc.list_indexes()]
        if pinecone_index_name not in existing:
            pc.create_index(
                name=pinecone_index_name,
                dimension=3072,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

        self.vector_store = PineconeVectorStore(
            index_name=pinecone_index_name,
            embedding=self.embeddings,
        )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.CHUNK_SIZE,
            chunk_overlap=self.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def index_pdf(self, pdf_bytes: bytes, filename: str) -> int:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        raw_docs = []

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            text = self._clean_text(text)
            if text.strip():
                raw_docs.append(
                    Document(
                        page_content=text,
                        metadata={"source": filename, "page": page_num},
                    )
                )

        chunks = self.splitter.split_documents(raw_docs)
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_id"] = i

        self.vector_store.add_documents(chunks)
        return len(chunks)

    def query(self, question: str, chat_history: list = None) -> dict:
        docs = self.vector_store.similarity_search(question, k=self.TOP_K)

        if not docs:
            return {
                "answer": "I could not find relevant information in the indexed documents.",
                "sources": [],
            }

        context_parts = []
        for i, doc in enumerate(docs, start=1):
            src  = doc.metadata.get("source", "unknown")
            page = doc.metadata.get("page", "?")
            context_parts.append(f"[Source {i}: {src}, Page {page}]\n{doc.page_content}")
        context = "\n\n---\n\n".join(context_parts)

        system_msg = SystemMessage(content=(
            "You are a helpful assistant that answers questions strictly based on "
            "the provided document context. "
            "Cite sources by referring to [Source N] inline when you use information from them. "
            "If the answer is not in the context, say so clearly. "
            "Be concise and accurate."
        ))

        history_msgs = []
        if chat_history:
            for turn in chat_history[-4:]:
                if turn["role"] == "user":
                    history_msgs.append(HumanMessage(content=turn["content"]))
                elif turn["role"] == "assistant":
                    history_msgs.append(AIMessage(content=turn["content"]))

        user_msg = HumanMessage(content=(
            f"Context from documents:\n\n{context}\n\nQuestion: {question}"
        ))

        messages = [system_msg] + history_msgs + [user_msg]
        response = self.llm.invoke(messages)

        sources = []
        for doc in docs:
            sources.append({
                "file":    doc.metadata.get("source", "unknown"),
                "page":    doc.metadata.get("page", "?"),
                "snippet": doc.page_content[:300].strip() + "...",
            })

        return {"answer": response.content, "sources": sources}

    @staticmethod
    def _clean_text(text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
        return text.strip()
