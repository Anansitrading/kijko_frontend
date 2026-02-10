"""Application configuration via pydantic-settings v2."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Kijko API configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Supabase ---
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_SERVICE_KEY: str = "placeholder-service-key"
    SUPABASE_ANON_KEY: str = "placeholder-anon-key"

    # --- Keycloak ---
    KEYCLOAK_URL: str = "https://auth.kijko.nl"
    KEYCLOAK_REALM: str = "kijko"
    KEYCLOAK_CLIENT_ID: str = "kijko-backend"
    KEYCLOAK_CLIENT_SECRET: str = ""

    # --- Stripe ---
    STRIPE_SECRET_KEY: str = "sk_test_placeholder"
    STRIPE_WEBHOOK_SECRET: str = "whsec_placeholder"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379"

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://app.kijko.nl",
    ]

    # --- App ---
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"
    APP_VERSION: str = "1.0.0"
    APP_TITLE: str = "Kijko API"

    # --- Celery ---
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"


settings = Settings()
