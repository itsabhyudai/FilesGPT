"""Ingestion: PDFs, scanned images and web pages all funnel into `_ingest`."""

import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from .. import db
from ..schemas import UploadResult
from ..security import current_user
from ..services import extract, rag

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg"}


async def _ingest(text: str, filename: str, user: dict) -> UploadResult:
    """Record the document, embed its text, and return the ingest summary."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted.")

    result = await db.uploads().insert_one(
        {
            "user_id": user["_id"],
            "email": user["email"],
            "filename": filename,
            "chunks": 0,
            "created_at": datetime.now(timezone.utc),
        }
    )
    document_id = str(result.inserted_id)

    try:
        chunks = await run_in_threadpool(
            rag.store, text, str(user["_id"]), document_id, filename
        )
    except Exception:
        # Don't leave an empty document behind that the user could try to query.
        await db.uploads().delete_one({"_id": result.inserted_id})
        raise

    await db.uploads().update_one({"_id": result.inserted_id}, {"$set": {"chunks": chunks}})
    logger.info("Ingested %s | doc=%s chunks=%d", filename, document_id, chunks)

    return UploadResult(document_id=document_id, filename=filename, chunks=chunks)


@router.post("/pdf", response_model=UploadResult)
async def upload_pdf(
    file: UploadFile | None = File(None),
    url: str | None = Form(None),
    user: dict = Depends(current_user),
):
    """Ingest a PDF, either uploaded directly or downloaded from a URL."""
    if file:
        text = await run_in_threadpool(extract.from_pdf, await file.read())
        return await _ingest(text, file.filename or "document.pdf", user)

    if url:
        text = await run_in_threadpool(extract.from_url, url)
        return await _ingest(text, url, user)

    raise HTTPException(status_code=400, detail="Provide a file or a url.")


@router.post("/image", response_model=UploadResult)
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(current_user),
):
    """Ingest a scanned image or image-only PDF via OCR."""
    extension = Path(file.filename or "").suffix.lstrip(".").lower()
    data = await file.read()

    if extension in IMAGE_EXTENSIONS:
        text = await run_in_threadpool(extract.from_image, data, extension)
    elif extension == "pdf":
        text = await run_in_threadpool(extract.from_scanned_pdf, data)
    else:
        raise HTTPException(
            status_code=400, detail="Unsupported file type. Upload a PNG, JPG or PDF."
        )

    return await _ingest(text, file.filename or "scan", user)


@router.post("/website", response_model=UploadResult)
async def upload_website(
    url: str = Form(...),
    user: dict = Depends(current_user),
):
    """Ingest the visible text of a web page."""
    text = await run_in_threadpool(extract.from_website, url)
    return await _ingest(text, url, user)
