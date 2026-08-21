from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "FilesGPT"

    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "filesgpt"

    # JWT
    JWT_SECRET: str = "change-this-secret"
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 1440

    # CORS — comma-separated list of allowed frontend origins
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Cloudinary (avatar uploads; optional)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX: str = "pdfgpt"

    # Models
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GOOGLE_API_KEY: str = ""
    GEMINI_OCR_MODEL: str = "gemini-2.5-flash-lite"
    EMBEDDING_MODEL: str = "intfloat/e5-large-v2"

    # Retrieval
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    RETRIEVAL_TOP_K: int = 5

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
