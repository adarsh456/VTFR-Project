import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from ...services.rag_service import rag_service, UPLOADS_DIR

router = APIRouter(prefix="/rag", tags=["RAG Textbook Ingestion"])

@router.post("/upload-pdf")
def upload_textbook_pdf(file: UploadFile = File(...)):
    """Uploads a PDF textbook chapter and embeds text chunks into ChromaDB."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = rag_service.ingest_pdf_textbook(file_path, file.filename)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF ingestion failed: {str(e)}")

@router.get("/query")
def query_textbook(query: str = Query(...), top_k: int = Query(3, ge=1, le=10)):
    """Queries vector store for semantic context matching textbook search query."""
    context_chunks = rag_service.query_context(query, top_k=top_k)
    return {
        "query": query,
        "count": len(context_chunks),
        "results": context_chunks
    }
