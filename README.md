# DocChat — Personal Document RAG Chatbot

Chat with your PDFs from the terminal.
Built with LangChain, Gemini 2.5 Flash, Gemini Embeddings, and Pinecone.

---

## Project Files

    doc-chatbot/
    ├── chat.py          <- run this to chat
    ├── rag_engine.py    <- RAG logic
    ├── requirements.txt <- exact pinned packages (use this!)
    ├── .env.example     <- API keys template
    └── README.md

---

## Setup (Fresh Machine)

### Step 1 — Create a virtual environment

    python -m venv venv

### Step 2 — Activate it

    # Mac / Linux:
    source venv/bin/activate

    # Windows PowerShell:
    venv\Scripts\Activate.ps1

    # Windows Command Prompt:
    venv\Scripts\activate

You will see (venv) in your prompt when active.

### Step 3 — Install exact dependencies

    pip install -r requirements.txt

This uses pinned versions that are confirmed working. No conflicts.

### Step 4 — Create your .env file

    # Mac/Linux:
    cp .env.example .env

    # Windows:
    copy .env.example .env

Fill in your keys:

    GEMINI_API_KEY=your_key_here
    PINECONE_API_KEY=your_key_here
    PINECONE_INDEX_NAME=doc-chatbot

### Step 5 — Run

    python chat.py

---

## Every Time You Return to This Project

    # 1. Activate venv
    venv\Scripts\Activate.ps1     # Windows PowerShell
    source venv/bin/activate       # Mac/Linux

    # 2. Run
    python chat.py

That's it — no reinstalling needed.

---

## API Keys

- Gemini  : https://aistudio.google.com/app/apikey
- Pinecone: https://app.pinecone.io  (free Starter tier)

---

## Notes

- Embedding model : models/gemini-embedding-001 (3072 dimensions)
- LLM model       : gemini-2.5-flash
- Pinecone index  : auto-created on first run (dimension=3072, cosine)
- Already indexed PDFs stay in Pinecone — no need to re-index on next run
- To clear the index: go to app.pinecone.io -> Indexes -> delete -> re-run
