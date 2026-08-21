"""Embedding, storage and retrieval. One Pinecone namespace per user+document."""

import logging
import os

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from functools import lru_cache

from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone

from ..config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a precise and helpful assistant. "
    "Answer the user's question using ONLY the context provided below. "
    "If the answer is not in the context, say 'I don't have enough information to answer that.' "
    "Do not make up information. Be concise and direct."
)


def _namespace(user_id: str, document_id: str) -> str:
    return f"{user_id}-{document_id}"


@lru_cache(maxsize=1)
def _index():
    if not settings.PINECONE_API_KEY:
        raise RuntimeError("PINECONE_API_KEY is not configured")
    return Pinecone(api_key=settings.PINECONE_API_KEY).Index(settings.PINECONE_INDEX)


@lru_cache(maxsize=1)
def _embeddings():
    return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def _llm():
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=0.1,
        max_tokens=2048,
        # gpt-oss models are reasoning models: reasoning tokens count against
        # max_tokens, so keep the effort low or long chains starve the answer.
        reasoning_effort="low",
    )


def store(text: str, user_id: str, document_id: str, source: str) -> int:
    """Chunk `text`, embed it and upsert into this document's namespace."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    docs = splitter.create_documents(
        [text],
        metadatas=[{"user_id": user_id, "document_id": document_id, "source": source}],
    )

    PineconeVectorStore.from_documents(
        documents=docs,
        embedding=_embeddings(),
        index_name=settings.PINECONE_INDEX,
        namespace=_namespace(user_id, document_id),
    )
    logger.info("Stored %d chunks | doc=%s", len(docs), document_id)
    return len(docs)


def answer(question: str, user_id: str, document_id: str, history: list[dict]) -> str:
    """Run retrieval-augmented generation against this document's namespace."""
    vectorstore = PineconeVectorStore(
        index=_index(),
        embedding=_embeddings(),
        namespace=_namespace(user_id, document_id),
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "Context:\n{context}\n\nQuestion:\n{input}"),
        ]
    )

    chain = create_retrieval_chain(
        vectorstore.as_retriever(search_kwargs={"k": settings.RETRIEVAL_TOP_K}),
        create_stuff_documents_chain(_llm(), prompt),
    )

    messages = [
        HumanMessage(turn["content"])
        if turn["role"] == "human"
        else AIMessage(turn["content"])
        for turn in history
        if turn.get("content", "").strip()
    ]

    response = chain.invoke({"input": question, "chat_history": messages})
    return (response.get("answer") or "").strip()


def delete_document(user_id: str, document_id: str) -> None:
    """Best-effort removal of one document's vectors; never blocks the caller."""
    try:
        _index().delete(namespace=_namespace(user_id, document_id), delete_all=True)
    except Exception as exc:
        logger.warning("Pinecone delete failed for %s: %s", document_id, exc)
