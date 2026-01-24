"""
应用配置
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """应用设置"""
    groq_api_key: str
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None  # 支持第三方API代理
    database_url: str = "sqlite:///./talk2me.db"
    audio_storage_path: str = "./storage/audio"
    feedback_storage_path: str = "./storage/feedback"
    
    class Config:
        env_file = ".env"

settings = Settings()
