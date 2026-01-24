"""
OpenAI TTS Service
用于生成高质量的AI语音
"""
from openai import OpenAI
from app.config import settings
import os
import uuid

class TTSService:
    def __init__(self):
        self.api_key = settings.openai_api_key
        self.base_url = settings.openai_base_url
        if self.api_key:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url if self.base_url else None
            )
        else:
            self.client = None
            print("Warning: OPENAI_API_KEY not found, TTS will be disabled")

    async def generate_speech(self, text: str, voice: str = "nova") -> str:
        """
        生成语音文件并返回相对路径
        """
        if not self.client:
            return None

        try:
            # 确保目录存在
            audio_dir = "storage/audio/tts"
            os.makedirs(audio_dir, exist_ok=True)

            # 生成唯一文件名
            filename = f"tts_{uuid.uuid4()}.mp3"
            file_path = f"{audio_dir}/{filename}"

            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,  # 使用指定的声音
                input=text
            )

            response.stream_to_file(file_path)
            
            # 返回前端可访问的相对 URL
            # 注意：这里假设静态文件挂载在 /audio 下
            return f"/audio/tts/{filename}"

        except Exception as e:
            print(f"TTS Generation Error: {e}")
            import traceback
            traceback.print_exc()
            return None
