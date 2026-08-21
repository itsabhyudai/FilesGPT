"""Querying a document and managing saved chat transcripts."""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.concurrency import run_in_threadpool

from .. import db
from ..schemas import Chat, ChatSummary, QueryRequest, QueryResponse, SaveChatRequest, Turn
from ..security import current_user, object_id
from ..services import rag

router = APIRouter(prefix="/chats", tags=["Chats"])
logger = logging.getLogger(__name__)


async def _owned_document(document_id: str, user: dict) -> ObjectId:
    """Resolve a document id, ensuring it belongs to the requesting user."""
    oid = object_id(document_id, "document ID")
    if not await db.uploads().find_one({"_id": oid, "user_id": user["_id"]}):
        raise HTTPException(status_code=404, detail="Document not found")
    return oid


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "pdf_name": doc.get("pdf_name") or "",
        "document_id": str(doc.get("document_id") or ""),
        "created_at": doc["created_at"],
        "messages": doc.get("messages", []),
    }


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, user: dict = Depends(current_user)):
    """Answer a question about a document, given the conversation so far."""
    await _owned_document(request.document_id, user)

    answer = await run_in_threadpool(
        rag.answer,
        request.question,
        str(user["_id"]),
        request.document_id,
        [turn.model_dump() for turn in request.chat_history],
    )

    # History lives on the client: we echo it back with this turn appended.
    history = request.chat_history + [
        Turn(role="human", content=request.question.strip()),
        Turn(role="assistant", content=answer),
    ]
    return QueryResponse(answer=answer, chat_history=history)


@router.post("", status_code=201)
async def save(request: SaveChatRequest, user: dict = Depends(current_user)):
    """Persist a chat transcript against its source document."""
    document_oid = await _owned_document(request.document_id, user)

    result = await db.chats().insert_one(
        {
            "user_id": user["_id"],
            "email": user["email"],
            "pdf_name": request.pdf_name,
            "document_id": document_oid,
            "messages": [message.model_dump() for message in request.messages],
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"id": str(result.inserted_id)}


@router.get("", response_model=list[ChatSummary])
async def list_chats(limit: int = 50, user: dict = Depends(current_user)):
    """List the current user's saved chats, newest first."""
    docs = (
        await db.chats()
        .find({"user_id": user["_id"]})
        .sort("created_at", -1)
        .to_list(length=limit)
    )
    return [_serialize(doc) for doc in docs]


@router.get("/{chat_id}", response_model=Chat)
async def get_chat(chat_id: str, user: dict = Depends(current_user)):
    doc = await db.chats().find_one(
        {"_id": object_id(chat_id, "chat ID"), "user_id": user["_id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Chat not found")
    return _serialize(doc)


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: str, user: dict = Depends(current_user)):
    """Delete a chat along with its source document and vectors."""
    oid = object_id(chat_id, "chat ID")
    doc = await db.chats().find_one({"_id": oid, "user_id": user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Chat not found")

    if document_id := doc.get("document_id"):
        await run_in_threadpool(rag.delete_document, str(user["_id"]), str(document_id))
        await db.uploads().delete_one({"_id": document_id, "user_id": user["_id"]})

    await db.chats().delete_one({"_id": oid})
    return Response(status_code=204)
