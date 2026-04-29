from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/meta_platform"
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "meta-attachments"
    minio_secure: bool = False

    model_config = {"env_file": ".env"}


settings = Settings()
