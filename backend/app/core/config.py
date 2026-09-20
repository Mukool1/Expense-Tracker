from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/expense_tracker"

    secret_key: str = "change-this-in-.env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    redis_url: str = "redis://localhost:6379/0"

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()