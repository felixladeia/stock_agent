from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "stock-agent-api"
    api_version: str = "0.1.0"
    allow_origins: list[str] = ["http://localhost:3000"]

settings = Settings()
