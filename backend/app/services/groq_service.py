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
            raise Exception(f"Groq API错误: {str(e)}")

    def transcribe_audio(self, audio_path: str) -> List[Dict]:
        """
        使用Groq Whisper模型转写音频 (极速)
        
        Args:
            audio_path: 音频文件路径
            
        Returns:
            句子列表 [{"text": "...", "start": 0.0, "end": 1.0}, ...]
        """
        try:
            with open(audio_path, "rb") as file:
                # 使用 Groq 的 Whisper Large V3 模型
                transcription = self.client.audio.transcriptions.create(
                    file=(audio_path, file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    temperature=0.0
                )
            
            # 转换格式以匹配原有 WhisperService 的输出
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
