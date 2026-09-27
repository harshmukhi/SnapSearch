# SnapSearch ⚡

**A Privacy-First, On-Device Semantic Search Engine designed for Snapdragon PCs.**

SnapSearch leverages the power of Qualcomm AI Hub and Snapdragon NPUs to let you search your local files by *context* and *meaning*, rather than just filenames. It runs 100% locally—no internet connection required, and zero data leaves your device.

## Why SnapSearch?
Traditional search relies on exact keyword matching. If you search for "Q3 Revenue", you won't find a document that says "Third Quarter Earnings". SnapSearch uses advanced AI embeddings to understand the semantic meaning of your files.

- 🔒 **Absolute Privacy**: All processing happens on your local device.
- ⚡ **Low Power & High Performance**: Optimized for Snapdragon, running embedding models efficiently on the NPU/CPU.
- 🧠 **Context-Aware**: Find what you mean, not just what you type.

## Tech Stack
- **AI / Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`) for search, `transformers` (`SmolLM2-135M-Instruct`) for local RAG chat
- **Vector DB**: `ChromaDB` (Local Persistent Storage)
- **Backend**: Python / FastAPI
- **Frontend**: React / Vite (Glassmorphic modern UI)

## How to Run Locally

### 1. Start the Backend (AI Engine)
Navigate to the `backend` directory, activate the virtual environment, and run the FastAPI server:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*(The API will be available at http://127.0.0.1:8000)*

### 2. Start the Frontend (UI)
Navigate to the `frontend` directory and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
*(The UI will be available at http://localhost:5173)*

## Hackathon Evaluation Alignment
- **Technical Implementation**: Integrates advanced vector databases and sentence embeddings running entirely locally.
- **Application Use Case & Innovation**: Solves the very real problem of fragmented local knowledge management without compromising privacy.
- **Deployment & Accessibility**: Easy to run on any Snapdragon Windows PC with minimal setup.
- **Presentation**: (See our pitch deck)
