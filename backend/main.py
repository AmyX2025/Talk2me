"""
Talk2Me Backend - FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Talk2Me API",
    description="英语口语练习平台后端API",
    version="0.1.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Talk2Me API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 导入路由
from app.api import podcast, conversation, feedback

app.include_router(podcast.router, prefix="/api/podcast", tags=["podcast"])
app.include_router(conversation.router, tags=["conversation"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

# 静态文件服务（音频文件）
os.makedirs("storage/audio", exist_ok=True)
app.mount("/audio", StaticFiles(directory="storage/audio"), name="audio")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
