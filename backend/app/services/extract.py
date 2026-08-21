"""Turn a PDF, image or web page into plain text. Nothing is written to disk."""

import logging
import re
import time
from functools import lru_cache

import pymupdf
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError

from ..config import settings

logger = logging.getLogger(__name__)

NOISE_TAGS = ["script", "style", "noscript", "header", "footer", "svg", "nav", "aside"]

OCR_PROMPT = (
    "Extract ALL text from this image exactly as it appears. "
    "Preserve paragraphs and line breaks. "
    "Return only the extracted text, no commentary or explanation."
)

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

MIME_BY_EXTENSION = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}


# ---------- PDF ----------


def from_pdf(data: bytes) -> str:
    """Extract the embedded text layer of a PDF."""
    with pymupdf.open(stream=data, filetype="pdf") as doc:
        return "\n\n".join(page.get_text("text") for page in doc).strip()


# ---------- HTML ----------


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(NOISE_TAGS):
        tag.decompose()
    text = re.sub(r"\n\s*\n+", "\n\n", soup.get_text(separator="\n"))
    return re.sub(r"[ \t]+", " ", text).strip()


def from_website(url: str, retries: int = 3, timeout: int = 30) -> str:
    """Fetch a URL and return its visible text."""
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(
                url, headers=BROWSER_HEADERS, timeout=timeout, allow_redirects=True
            )
            response.raise_for_status()
            return _html_to_text(response.text)

        except requests.HTTPError as exc:
            status = exc.response.status_code
            detail = {
                403: "The website is blocking automated requests.",
                404: "Page not found.",
            }.get(status, f"The website returned HTTP {status}.")
            raise HTTPException(status_code=400, detail=detail)

        except requests.RequestException as exc:
            logger.warning("Fetch failed (attempt %d/%d): %s", attempt, retries, exc)
            if attempt == retries:
                raise HTTPException(
                    status_code=400, detail="Could not reach the website. Check the URL."
                )
            time.sleep(2)

    raise HTTPException(status_code=400, detail="Could not reach the website.")


def from_url(url: str) -> str:
    """Download a URL and extract its text, handling both PDF and HTML responses."""
    try:
        response = requests.get(url, headers=BROWSER_HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Download failed for %s: %s", url, exc)
        raise HTTPException(status_code=400, detail="Could not download the file at that URL.")

    content_type = response.headers.get("content-type", "").lower()
    if "application/pdf" in content_type or url.lower().split("?")[0].endswith(".pdf"):
        return from_pdf(response.content)
    return _html_to_text(response.text)


# ---------- OCR (Gemini) ----------

RATE_LIMIT_ERROR = (
    "Our document processing service is currently busy. "
    "Please wait a moment and try uploading again."
)
TOO_LARGE_ERROR = (
    "This file is too large to process. "
    "Please try a smaller image or split your PDF into fewer pages."
)
GENERIC_OCR_ERROR = (
    "We couldn't extract text from your file. "
    "Please make sure it's a clear image or scanned document and try again."
)


@lru_cache(maxsize=1)
def _gemini():
    if not settings.GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is not configured")
    return genai.Client(api_key=settings.GOOGLE_API_KEY)


def _ocr(data: bytes, mime_type: str) -> str:
    """OCR one image via Gemini, retrying once if we are rate limited."""
    for attempt in range(2):
        try:
            response = _gemini().models.generate_content(
                model=settings.GEMINI_OCR_MODEL,
                contents=[types.Part.from_bytes(data=data, mime_type=mime_type), OCR_PROMPT],
            )
            return (response.text or "").strip()

        except APIError as exc:
            message = str(exc).lower()
            status = getattr(exc, "code", None) or getattr(exc, "status_code", None)

            if status == 413 or "too large" in message or "payload" in message:
                raise HTTPException(status_code=413, detail=TOO_LARGE_ERROR)

            rate_limited = status == 429 or any(
                word in message for word in ("quota", "rate", "resource_exhausted")
            )
            if rate_limited and attempt == 0:
                logger.warning("Gemini rate limit — retrying in 60s")
                time.sleep(60)
                continue

            logger.error("Gemini OCR failed (status=%s): %s", status, exc)
            raise HTTPException(status_code=503, detail=RATE_LIMIT_ERROR)

        except Exception as exc:
            logger.error("Gemini OCR unexpected error: %s", exc)
            raise HTTPException(status_code=502, detail=GENERIC_OCR_ERROR)

    raise HTTPException(status_code=503, detail=RATE_LIMIT_ERROR)


def from_image(data: bytes, extension: str) -> str:
    """OCR a single image file."""
    return _ocr(data, MIME_BY_EXTENSION.get(extension, "image/png"))


def from_scanned_pdf(data: bytes) -> str:
    """OCR every page of a PDF by rendering each to a 2x PNG."""
    pages: list[str] = []

    with pymupdf.open(stream=data, filetype="pdf") as doc:
        total = len(doc)
        for number, page in enumerate(doc, start=1):
            image = page.get_pixmap(matrix=pymupdf.Matrix(2, 2)).tobytes("png")
            try:
                text = _ocr(image, "image/png")
            except HTTPException as exc:
                # Tell the user how far we got before giving up.
                if pages:
                    exc.detail = f"{exc.detail} ({number - 1} of {total} pages were processed.)"
                raise

            if text:
                pages.append(f"--- Page {number} ---\n{text}")
            logger.info("OCR page %d/%d | chars=%d", number, total, len(text))

    return "\n\n".join(pages)
