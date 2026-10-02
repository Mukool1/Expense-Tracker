from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/expense_tracker"

    secret_key: str = "change-this-in-.env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Comma-separated list of allowed frontend origins, e.g.
    # "https://expenseai-web.onrender.com,http://localhost:5173"
    frontend_url: str = "http://localhost:5173"

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_url.split(",") if o.strip()]


settings = Settings()
