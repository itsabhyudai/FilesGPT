"""Signup, login and profile management."""

import logging
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from starlette.concurrency import run_in_threadpool

from .. import db
from ..config import settings
from ..schemas import Token, UserPublic
from ..security import create_access_token, current_user, hash_password, verify_password
from ..services import rag

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _public(doc: dict) -> UserPublic:
    return UserPublic(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        avatar_url=doc.get("avatar_url"),
        created_at=doc["created_at"],
    )


async def _upload_avatar(avatar: UploadFile) -> str:
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(status_code=503, detail="Avatar uploads are not configured.")
    result = await run_in_threadpool(
        cloudinary.uploader.upload,
        avatar.file,
        folder="filesgpt/users",
        resource_type="image",
        use_filename=True,
        unique_filename=True,
    )
    return result["secure_url"]


@router.post("/signup", response_model=UserPublic, status_code=201)
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    avatar: UploadFile | None = File(None),
):
    email = email.lower().strip()
    if await db.users().find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered.")

    doc = {
        "name": name.strip(),
        "email": email,
        "password_hash": hash_password(password),
        "avatar_url": await _upload_avatar(avatar) if avatar else None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users().insert_one(doc)
    return _public({**doc, "_id": result.inserted_id})


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await db.users().find_one({"email": form.username.lower().strip()})
    if not user or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    return Token(access_token=create_access_token(user["email"]))


@router.get("/me", response_model=UserPublic)
async def get_me(user: dict = Depends(current_user)):
    return _public(user)


@router.put("/me", response_model=UserPublic)
async def update_me(
    name: str | None = Form(None),
    password: str | None = Form(None),
    new_avatar: UploadFile | None = File(None),
    user: dict = Depends(current_user),
):
    changes = {}
    if name:
        changes["name"] = name.strip()
    if password:
        changes["password_hash"] = hash_password(password)
    if new_avatar:
        changes["avatar_url"] = await _upload_avatar(new_avatar)

    if changes:
        await db.users().update_one({"_id": user["_id"]}, {"$set": changes})
        user.update(changes)

    return _public(user)


@router.delete("/me", status_code=204)
async def delete_me(user: dict = Depends(current_user)):
    """Delete the account and everything attached to it: vectors, uploads, chats."""
    user_id = user["_id"]

    documents = await db.uploads().find({"user_id": user_id}).to_list(length=None)
    for document in documents:
        await run_in_threadpool(rag.delete_document, str(user_id), str(document["_id"]))

    await db.uploads().delete_many({"user_id": user_id})
    await db.chats().delete_many({"user_id": user_id})
    await db.users().delete_one({"_id": user_id})

    logger.info("Deleted account %s and %d document(s)", user_id, len(documents))
    return Response(status_code=204)
