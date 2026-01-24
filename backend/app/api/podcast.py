"""
播客相关API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.podcast_service import PodcastService

router = APIRouter()
podcast_service = PodcastService()

class PodcastRequest(BaseModel):
    url: str

class PodcastResponse(BaseModel):
    title: str
    audio_url: str
    sentences: List[Dict]
    duration: float

@router.post("/process", response_model=PodcastResponse)
async def process_podcast(request: PodcastRequest):
    """
    处理播客链接
    
    接收播客URL，下载音频，转写文字，返回句子列表
    """
    try:
        result = podcast_service.process_podcast_url(request.url)
        return PodcastResponse(
            title=result["title"],
            audio_url=result["audio_url"],
            sentences=result["sentences"],
            duration=result["duration"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
