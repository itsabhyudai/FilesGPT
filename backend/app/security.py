from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from . import db
from .config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    return jwt.encode(
        {"sub": email, "exp": expire}, settings.JWT_SECRET, algorithm=settings.JWT_ALG
    )


async def current_user(token: str = Depends(_oauth2)) -> dict:
    """Resolve the bearer token to the user document. `_id` is an ObjectId."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        email = payload.get("sub")
    except JWTError:
        raise CREDENTIALS_ERROR

    if not email:
        raise CREDENTIALS_ERROR

    user = await db.users().find_one({"email": email})
    if not user:
        raise CREDENTIALS_ERROR
    return user


def object_id(value: str, label: str) -> ObjectId:
    """Parse a path/body id, returning 400 rather than 500 on malformed input."""
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)
