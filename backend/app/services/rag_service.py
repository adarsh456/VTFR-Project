import os
from typing import List, Dict, Any
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Directory setup for uploads and vector DB
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOADS_DIR = os.path.join(BASE_DIR, "static", "uploads")
CHROMA_DIR = os.path.join(BASE_DIR, "static", "chroma_db")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

class RAGService:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self._init_chroma()

    def _init_chroma(self):
        try:
            import chromadb
            self.chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
            self.collection = self.chroma_client.get_or_create_collection(
                name="textbook_embeddings",
                metadata={"description": "VTFR Textbook Chapter Vector Embeddings"}
            )
        except Exception as e:
            print(f"ChromaDB initialization warning: {e}")

    def ingest_pdf_textbook(self, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Parses PDF document, chunks text into semantic segments, and embeds into ChromaDB.
        """
        reader = PdfReader(file_path)
        raw_text = ""
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                raw_text += f"\n--- Page {i+1} ---\n" + text

        if not raw_text.strip():
            raise ValueError("No extractable text found in PDF document.")

        # Chunk text
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=600,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        chunks = splitter.split_text(raw_text)

        ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

        if self.collection:
            self.collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )

        return {
            "status": "success",
            "filename": filename,
            "totalPages": len(reader.pages),
            "totalChunks": len(chunks),
            "message": f"Successfully ingested {len(chunks)} chunks into ChromaDB."
        }

    def query_context(self, query: str, top_k: int = 3) -> List[str]:
        """Queries local ChromaDB vector store for relevant textbook context."""
        if not self.collection or self.collection.count() == 0:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        documents = results.get("documents", [[]])[0]
        return documents

rag_service = RAGService()
