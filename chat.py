"""
DocChat CLI — Test your RAG system from the terminal
Usage:  python chat.py
"""

import os
import sys
from dotenv import load_dotenv
from rag_engine import RAGEngine

load_dotenv()


def get_api_keys():
    """Read keys from .env or prompt the user interactively."""
    gemini_key      = os.getenv("GEMINI_API_KEY", "").strip()
    pinecone_key    = os.getenv("PINECONE_API_KEY", "").strip()
    pinecone_index  = os.getenv("PINECONE_INDEX_NAME", "").strip()

    if not gemini_key:
        gemini_key = input("Enter your Gemini API key: ").strip()
    if not pinecone_key:
        pinecone_key = input("Enter your Pinecone API key: ").strip()
    if not pinecone_index:
        pinecone_index = input("Enter your Pinecone index name (e.g. doc-chatbot): ").strip()

    return gemini_key, pinecone_key, pinecone_index


def index_pdfs(rag: RAGEngine):
    """Ask the user which PDFs to index."""
    print("\n📄 Enter PDF file paths to index (one per line).")
    print("   Press ENTER on an empty line when done.\n")

    indexed = []
    while True:
        path = input("  PDF path: ").strip().strip('"').strip("'")
        if not path:
            break
        if not os.path.isfile(path):
            print(f"  ⚠️  File not found: {path}")
            continue
        if not path.lower().endswith(".pdf"):
            print("  ⚠️  Only PDF files are supported.")
            continue

        print(f"  ⏳ Indexing {os.path.basename(path)} …", end="", flush=True)
        with open(path, "rb") as f:
            chunks = rag.index_pdf(f.read(), os.path.basename(path))
        print(f" ✅  {chunks} chunks stored.")
        indexed.append(os.path.basename(path))

    return indexed


def chat_loop(rag: RAGEngine, indexed_files: list[str]):
    """Interactive Q&A loop."""
    print("\n" + "═" * 60)
    print("  💬  DocChat — Ask questions about your documents")
    print(f"  📚  Indexed: {', '.join(indexed_files)}")
    print("  Type 'quit' or 'exit' to stop.")
    print("═" * 60 + "\n")

    history = []

    while True:
        try:
            question = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nGoodbye! 👋")
            break

        if not question:
            continue
        if question.lower() in ("quit", "exit", "q"):
            print("Goodbye! 👋")
            break

        print("\n⏳ Thinking…\n")
        result = rag.query(question, chat_history=history)

        print(f"Assistant:\n{result['answer']}\n")

        # Show sources
        if result["sources"]:
            print("📎 Sources:")
            for i, src in enumerate(result["sources"], 1):
                print(f"  [{i}] {src['file']}  — Page {src['page']}")
                print(f"      \"{src['snippet'][:120]}…\"")
        print("\n" + "─" * 60 + "\n")

        # Update history (keep last 6 turns to avoid huge prompts)
        history.append({"role": "user",      "content": question})
        history.append({"role": "assistant", "content": result["answer"]})
        history = history[-12:]


def main():
    print("\n" + "═" * 60)
    print("  📚  DocChat RAG System — Terminal Mode")
    print("═" * 60)

    # 1. Get API keys
    gemini_key, pinecone_key, pinecone_index = get_api_keys()

    # 2. Initialise engine
    print("\n⏳ Connecting to Gemini and Pinecone…", end="", flush=True)
    try:
        rag = RAGEngine(
            gemini_api_key=gemini_key,
            pinecone_api_key=pinecone_key,
            pinecone_index_name=pinecone_index,
        )
        print(" ✅  Connected!\n")
    except Exception as e:
        print(f"\n❌  Failed to initialise: {e}")
        sys.exit(1)

    # 3. Index PDFs (optional — skip if already indexed)
    print("Do you want to index new PDF files? (y/n): ", end="")
    if input().strip().lower() in ("y", "yes"):
        indexed = index_pdfs(rag)
        if not indexed:
            print("  ⚠️  No files indexed. Querying existing index (if any).")
    else:
        print("  ℹ️  Skipping indexing — querying existing Pinecone index.")
        indexed = ["(existing index)"]

    # 4. Chat!
    chat_loop(rag, indexed)


if __name__ == "__main__":
    main()
