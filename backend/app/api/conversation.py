"""
对话相关API
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.groq_service import GroqService
from app.services.tts_service import TTSService
import base64
import json

# 延迟导入Whisper
try:
    from app.services.whisper_service import WhisperService
    whisper_service = WhisperService()
    WHISPER_AVAILABLE = True
except ImportError:
    whisper_service = None
    WHISPER_AVAILABLE = False
    print("警告: faster-whisper未安装，语音识别功能将不可用")

router = APIRouter()
groq_service = GroqService()
tts_service = TTSService()

# 存储对话历史
conversation_histories = {}

@router.websocket("/ws/conversation")
async def websocket_conversation(websocket: WebSocket):
    await websocket.accept()
    conversation_id = None
    conversation_history = []
    segment_text = ""

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "init":
                # 初始化对话
                conversation_id = f"conv_{id(websocket)}"
                segment_text = message.get("segment_text", "")
                voice = message.get("voice", "nova")  # 获取声音偏好
                
                # 生成系统提示词
                system_prompt = groq_service.generate_role_play_prompt(
                    segment_text,
                    user_role="learner"
                )
                
                # 发送欢迎消息
                welcome_message = groq_service.generate_response(
                    user_message="Hello, I'm ready to practice.",
                    system_prompt=system_prompt,
                    conversation_history=[]
                )
                
                # 更新对话历史
                conversation_history.append({
                    "role": "user",
                    "content": "Hello, I'm ready to practice."
                })
                conversation_history.append({
                    "role": "assistant",
                    "content": welcome_message
                })
                
                # 生成语音
                audio_url = await tts_service.generate_speech(welcome_message, voice=voice)
                
                await websocket.send_json({
                    "type": "ai_message",
                    "text": welcome_message,
                    "audio_url": audio_url
                })

            elif message["type"] == "user_audio":
                # 处理用户音频
                if not WHISPER_AVAILABLE:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Whisper未安装，请使用文字输入或运行: pip install faster-whisper"
                    })
                    continue
                
                audio_base64 = message.get("audio", "")
                audio_data = base64.b64decode(audio_base64)
                
                # 使用Whisper识别
                user_text = whisper_service.transcribe_realtime(audio_data)
                
                if not user_text.strip():
                    await websocket.send_json({
                        "type": "error",
                        "message": "无法识别语音，请重试"
                    })
                    continue

                # 生成AI回复
                system_prompt = groq_service.generate_role_play_prompt(
                    segment_text,
                    user_role="learner"
                )
                
                ai_response = groq_service.generate_response(
                    user_message=user_text,
                    system_prompt=system_prompt,
                    conversation_history=conversation_history
                )

                # 更新对话历史
                conversation_history.append({
                    "role": "user",
                    "content": user_text
                })
                conversation_history.append({
                    "role": "assistant",
                    "content": ai_response
                })

                # 生成语音
                voice = message.get("voice", "nova")
                audio_url = await tts_service.generate_speech(ai_response, voice=voice)
                
                # 发送AI回复
                await websocket.send_json({
                    "type": "ai_message",
                    "text": ai_response,
                    "audio_url": audio_url
                })

            elif message["type"] == "user_message":
                # 处理用户文字消息
                user_text = message.get("text", "")
                voice = message.get("voice", "nova")
                
                if not user_text.strip():
                    continue

                # 生成AI回复
                system_prompt = groq_service.generate_role_play_prompt(
                    segment_text,
                    user_role="learner"
                )
                
                ai_response = groq_service.generate_response(
                    user_message=user_text,
                    system_prompt=system_prompt,
                    conversation_history=conversation_history
                )

                # 更新对话历史
                conversation_history.append({
                    "role": "user",
                    "content": user_text
                })
                conversation_history.append({
                    "role": "assistant",
                    "content": ai_response
                })

                # 生成语音
                audio_url = await tts_service.generate_speech(ai_response, voice=voice)

                # 发送AI回复
                await websocket.send_json({
                    "type": "ai_message",
                    "text": ai_response,
                    "audio_url": audio_url
                })

    except WebSocketDisconnect:
        # 清理对话历史
        if conversation_id:
            conversation_histories.pop(conversation_id, None)
    except Exception as e:
        print(f"WebSocket Error: {e}")  # 打印错误到终端
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
