# RAG PDF Chatbot — Full Stack

Chat with your PDFs via terminal OR a premium web interface.
Backend: FastAPI + LangChain + Gemini + Pinecone
Frontend: React + Vite

---

## Project Structure

    rag-pdf-chatbot/
    │
    ├── backend/
    │   ├── main.py            <- FastAPI server (for web UI)
    │   ├── chat.py            <- Terminal chatbot (run directly)
    │   ├── rag_engine.py      <- RAG logic (shared by both)
    │   ├── requirements.txt   <- Python packages
    │   ├── .env.example       <- API keys template
    │   └── .env               <- Your actual keys (create this)
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── Sidebar.jsx    <- Upload panel
    │   │   │   └── Message.jsx    <- Chat bubble + sources
    │   │   ├── App.jsx            <- Main app
    │   │   ├── api.js             <- Axios API calls
    │   │   ├── main.jsx           <- React entry point
    │   │   └── index.css          <- All styles
    │   ├── index.html
    │   ├── package.json
    │   └── vite.config.js
    │
    └── README.md

---

## Python Version — IMPORTANT

This project requires Python 3.11. It does NOT work on Python 3.12, 3.13, or 3.14
due to dependency compatibility issues with LangChain packages.

### Step 1 — Check your current Python version

    python --version

If it shows 3.11.x you are good, skip to OPTION A or B directly.
If it shows anything else (e.g. 3.14), follow the steps below.

### Step 2 — Check if Python 3.11 is already installed

    py -3.11 --version

If it shows Python 3.11.x, great — it is already installed. Skip to Step 4.
If you get an error like "No such version", install it in Step 3.

### Step 3 — Install Python 3.11 (only if not already installed)

Download from the official site: https://www.python.org/downloads/release/python-3119/

Scroll down to "Files" and download:
- Windows 64-bit: Windows installer (64-bit)

During installation, check the box that says "Add Python to PATH".
After installing, close and reopen your terminal, then run:

    py -3.11 --version

It should now show Python 3.11.x.

### Step 4 — Always create your venv using Python 3.11

Instead of the plain `python -m venv venv` command, always use:

    py -3.11 -m venv venv

This forces the virtual environment to use 3.11 regardless of what your
default Python version is. Once the venv is activated, `python --version`
inside it will always show 3.11.

    venv\Scripts\Activate.ps1   # activate it
    python --version            # should now say Python 3.11.x  ✅

Note: VS Code's status bar at the bottom may still show Python 3.14 —
that is the global version and is fine to ignore. What matters is the
version shown when you run `python --version` inside the activated venv.

---

## OPTION A — Terminal Mode (simple, no browser needed)

    cd backend

    py -3.11 -m venv venv            # Windows (use this, not plain python)
    python3.11 -m venv venv          # Mac/Linux

    venv\Scripts\Activate.ps1        # Windows PowerShell
    source venv/bin/activate         # Mac/Linux

    pip install -r requirements.txt

    copy .env.example .env             # Windows
    cp .env.example .env               # Mac/Linux
    # Fill in your API keys in .env

    python chat.py

---

## OPTION B — Full Web UI (FastAPI + React)

Requires TWO terminals open at the same time.

### Terminal 1 — Backend

    cd backend
    py -3.11 -m venv venv            # Windows (use this, not plain python)
    venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    copy .env.example .env    # fill in your keys
    uvicorn main:app --reload

    Backend runs at: http://localhost:8000

### Terminal 2 — Frontend

    cd frontend
    npm install
    npm run dev

    Frontend runs at: http://localhost:5173

Open http://localhost:5173 in your browser.

---

## Usage (Web UI)

1. Drag and drop PDF files into the left sidebar
2. Wait for chunks indexed confirmation
3. Type your question and press Enter
4. Expand Sources under any answer to see page citations

---

## API Endpoints (Backend)

    GET  /health   -> check if backend is alive
    POST /upload   -> upload and index a PDF
    POST /query    -> ask a question, returns answer + sources

---

## API Keys (both free)

- Gemini  : https://aistudio.google.com/app/apikey
- Pinecone: https://app.pinecone.io

---

## Notes

- chat.py and main.py both use the same rag_engine.py
- PDFs stay indexed in Pinecone permanently
- Gemini free tier: ~750 questions per day
- Pinecone free tier: 100,000 vectors
- Always use Python 3.11 (py -3.11 -m venv venv) to avoid issues