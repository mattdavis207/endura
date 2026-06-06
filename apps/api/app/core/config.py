from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Endura API"
    app_version: str = "0.1.0"
    app_env: str = "local"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/endura"
    cors_origins: str = "http://localhost:8081,http://localhost:19006"
    openai_api_key: str | None = None
    strava_client_id: str
    strava_client_secret: str
    strava_redirect_uri: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
