"""
Groq API 服务
用于AI对话生成
"""
from groq import Groq
from app.config import settings
from typing import List, Dict

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama-3.3-70b-versatile"
    
    def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        生成AI回复
        
        Args:
            user_message: 用户消息
            system_prompt: 系统提示词（角色设定）
            conversation_history: 对话历史
        
        Returns:
            AI回复文本
        """
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加对话历史
        if conversation_history:
            messages.extend(conversation_history)
        
        # 添加当前用户消息
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Groq API错误: {str(e)}")

        except Exception as e:
            raise Exception(f"Groq API错误: {str(e)}")

    def transcribe_audio(self, audio_path: str) -> List[Dict]:
        """
        使用Groq Whisper模型转写音频 (极速)
        会自动处理大文件：如果超过24MB，则进行压缩
        
        Args:
            audio_path: 音频文件路径
            
        Returns:
            句子列表 [{"text": "...", "start": 0.0, "end": 1.0}, ...]
        """
        import os
        from pydub import AudioSegment
        
        # Groq (类似于OpenAI) 的限制通常是 25MB
        MAX_SIZE_BYTES = 24 * 1024 * 1024  # 24MB to be safe
        file_to_upload = audio_path
        is_temp_file = False
        
        try:
            file_size = os.path.getsize(audio_path)
            
            # 如果文件过大，进行压缩
            if file_size > MAX_SIZE_BYTES:
                print(f"音频文件过大 ({file_size / 1024 / 1024:.2f} MB)，正在压缩...")
                
                # 创建临时文件路径
                import tempfile
                import subprocess
                
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                    temp_path = tmp.name
                
                # 使用 FFmpeg 命令行进行压缩 (比 pydub 更节省内存)
                # -y: 覆盖
                # -i: 输入
                # -ac 1: 单声道
                # -ar 16000: 16kHz 采样率 (Whisper 只需要 16k)
                # -b:a 32k: 比特率压缩
                cmd = [
                    "ffmpeg", "-y",
                    "-i", audio_path,
                    "-ac", "1",
                    "-ar", "16000",
                    "-b:a", "32k",
                    temp_path
                ]
                
                # 执行压缩
                process = subprocess.run(
                    cmd, 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    check=False  # 手动检查 returncode
                )
                
                if process.returncode != 0:
                    print(f"FFmpeg compression failed: {process.stderr.decode()}")
                    # 如果压缩失败，尝试原样上传（可能会报413，但至少试过）
                    # 或者抛出异常
                    pass 
                else:
                    file_to_upload = temp_path
                    is_temp_file = True
                    new_size = os.path.getsize(temp_path)
                    print(f"压缩完成，新大小: {new_size / 1024 / 1024:.2f} MB")
            
            # 开始转写
            with open(file_to_upload, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=(file_to_upload, file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    temperature=0.0
                )
            
            # 转换格式
            sentences = []
            for segment in transcription.segments:
                sentences.append({
                    "text": segment["text"].strip(),
                    "start": round(segment["start"], 2),
                    "end": round(segment["end"], 2)
                })
            
            return sentences
            
        except Exception as e:
            raise Exception(f"Groq转写错误: {str(e)}")
        finally:
            # 清理临时文件
            if is_temp_file and os.path.exists(file_to_upload):
                try:
                    os.remove(file_to_upload)
                except:
                    pass
    
    def generate_role_play_prompt(
        self,
        podcast_context: str,
        user_role: str = "learner"
    ) -> str:
        """
        生成Role Play的系统提示词
        
        Args:
            podcast_context: 播客片段内容
            user_role: 用户角色（learner表示学习者，不是播客主播）
        
        Returns:
            系统提示词
        """
        return f"""You are Host A from All Ears English podcast. 
You're having a friendly conversation with a language learner who has been practicing with your podcast.

Context from podcast:
{podcast_context}

Your Goal:
Engage in a natural, "Free Talk" conversation derived from this context. 
CRITICAL: While chatting naturally, your hidden agenda is to help them practice the LANGUAGE POINTS (vocabulary/grammar) from the context above (e.g., if the context is about 'near vs nearby', try to use these words and create situations for the user to use them).

Your Role:
1. **Be a Friend, Not a Teacher**: Don't lecture. Don't say "Let's practice grammar." Just chat.
2. **Subtle Guiding**: If the user talks about something unrelated, listen first, then gently bridge back to themes that allow using the target language.
3. **Implicit Correction (Recast)**: If they make a mistake, don't say "Wrong." Just repeat their idea back to them using the CORRECT grammar/vocabulary. 
   - User: "I go to gym near."
   - You: "Oh, you go to the gym nearby? That's great! Is it near your house?"
4. **Encourage Flow**: Keep the conversation moving. Ask open-ended questions.

Conversation Style:
- Energetic, encouraging, and American.
- Use simple, clear English suitable for a learner.
- Keep responses concise (2-3 sentences max).

Now start/continue the conversation naturally."""
