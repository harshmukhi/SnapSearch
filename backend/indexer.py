import os
import chromadb
from sentence_transformers import SentenceTransformer
import uuid
import pypdf
from transformers import pipeline

# Initialize the embedding model (runs locally)
# Using a small model for fast CPU/NPU inference on Snapdragon
print("Loading Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize ChromaDB (local persistent storage)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="snapsearch_docs")

def parse_and_index_directory(directory_path: str):
    if not os.path.isdir(directory_path):
        return {"error": "Invalid directory path"}
        
    indexed_files = 0
    
    for root, _, files in os.walk(directory_path):
        for file in files:
            # Support for text, markdown, and PDF files
            if file.endswith(('.txt', '.md', '.pdf')):
                file_path = os.path.join(root, file)
                try:
                    text_content = ""
                    if file.endswith('.pdf'):
                        reader = pypdf.PdfReader(file_path)
                        for page in reader.pages:
                            text_content += page.extract_text() + "\n"
                    else:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            text_content = f.read()
                        
                    # Simple chunking: split text into 1000 character blocks
                    chunks = [text_content[i:i+1000] for i in range(0, len(text_content), 1000)]
                    
                    for i, chunk in enumerate(chunks):
                        embedding = model.encode(chunk).tolist()
                        chunk_id = f"{file_path}_{i}_{uuid.uuid4().hex[:6]}"
                        
                        collection.add(
                            embeddings=[embedding],
                            documents=[chunk],
                            metadatas=[{"source": file_path}],
                            ids=[chunk_id]
                        )
                    indexed_files += 1
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    
    return {"status": "success", "indexed_files": indexed_files}

def search_documents(query: str, n_results: int = 5):
    query_embedding = model.encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    formatted_results = []
    if results['documents'] and results['documents'][0]:
        for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
            formatted_results.append({
                "document": doc,
                "source": meta["source"]
            })
            
    return formatted_results

def get_indexed_sources():
    try:
        all_docs = collection.get()
        if not all_docs or 'metadatas' not in all_docs or not all_docs['metadatas']:
            return []
        
        sources = set()
        for meta in all_docs['metadatas']:
            if meta and 'source' in meta:
                sources.add(meta['source'])
        return list(sources)
    except Exception as e:
        print(f"Error getting sources: {e}")
        return []

def clear_index():
    try:
        all_docs = collection.get()
        if all_docs and 'ids' in all_docs and all_docs['ids']:
            collection.delete(ids=all_docs['ids'])
        return {"status": "cleared"}
    except Exception as e:
        print(f"Error clearing index: {e}")
        return {"status": "error"}

print("Loading Generative Model for Chat (RAG)...")
generator = pipeline("text-generation", model="HuggingFaceTB/SmolLM2-135M-Instruct")

def chat_with_documents(query: str):
    # 1. Retrieve the most relevant chunks from the local database
    results = search_documents(query, n_results=3)
    
    if not results:
        return "I couldn't find any relevant information in your indexed files to answer this."
        
    # 2. Combine the retrieved snippets into a context block
    context = " ".join([r['document'] for r in results])
    
    # 3. Truncate context to avoid overwhelming the small local model
    context = context[:1500] 
    
    # 4. Prompt the local LLM
    try:
        messages = [
            {"role": "system", "content": "You are a helpful local AI assistant. Answer the user's question based ONLY on the provided context."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query}"}
        ]
        prompt = generator.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        response = generator(prompt, max_new_tokens=150, return_full_text=False)
        
        answer = response[0]['generated_text'].strip()
        if not answer:
            return "I understood the context, but I had trouble generating a clear response."
        return answer
    except Exception as e:
        print(f"Error generating chat: {e}")
        return "Sorry, I encountered an error while thinking."
