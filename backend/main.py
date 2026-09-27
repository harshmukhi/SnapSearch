from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from indexer import parse_and_index_directory, search_documents, get_indexed_sources, clear_index, chat_with_documents

app = FastAPI(title="SnapSearch API")

# Allow the frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IndexRequest(BaseModel):
    path: str

class SearchRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"message": "SnapSearch API is running"}

@app.post("/index")
def index_directory(req: IndexRequest):
    result = parse_and_index_directory(req.path)
    return result

@app.post("/search")
def search(req: SearchRequest):
    results = search_documents(req.query)
    return {"query": req.query, "results": results}

@app.get("/sources")
def get_sources():
    sources = get_indexed_sources()
    return {"sources": sources}

@app.post("/clear")
def clear_db():
    return clear_index()

class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
def chat(req: ChatRequest):
    answer = chat_with_documents(req.query)
    return {"query": req.query, "answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
