"""
Whisper 语音识别服务
使用本地 openai-whisper 模型
"""
try:
    from faster_whisper import WhisperModel
    USE_FASTER_WHISPER = True
except ImportError:
    try:
        import whisper
        USE_FASTER_WHISPER = False
    except ImportError:
        whisper = None
        USE_FASTER_WHISPER = None

from typing import List, Dict
import os

# 设置ffmpeg路径（如果系统PATH中没有）
_FFMPEG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'bin', 'ffmpeg')
if os.path.exists(_FFMPEG_PATH):
    os.environ['PATH'] = os.path.dirname(_FFMPEG_PATH) + os.pathsep + os.environ.get('PATH', '')
    # 也设置给ffmpeg-python使用
    os.environ['FFMPEG_BINARY'] = _FFMPEG_PATH

def _load_whisper_model_with_ssl_fix(model_size: str):
    """
    加载Whisper模型，处理SSL证书问题
    """
    import ssl
    import urllib.request
    
    # 创建不验证SSL的context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    # 临时修改urllib的默认context
    original_opener = urllib.request.urlopen
    
    def urlopen_without_ssl(*args, **kwargs):
        if 'context' not in kwargs:
            kwargs['context'] = ssl_context
        return original_opener(*args, **kwargs)
    
    urllib.request.urlopen = urlopen_without_ssl
    
    try:
        return whisper.load_model(model_size)
    finally:
        # 恢复原始opener
        urllib.request.urlopen = original_opener

class WhisperService:
    def __init__(self, model_size: str = "base"):
        """
        初始化Whisper模型
        
        Args:
            model_size: 模型大小 (tiny, base, small, medium, large)
        """
        self.model_size = model_size
        if USE_FASTER_WHISPER:
            # 使用faster-whisper（更快）
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
            self.use_faster = True
        elif whisper:
            # 使用openai-whisper（官方版本）- 延迟加载模型
            self.model = None  # 延迟加载
            self.use_faster = False
        else:
            self.model = None
            self.use_faster = None
    
    def transcribe(self, audio_path: str, language: str = "en") -> List[Dict]:
        """
        转录音频文件
        
        Args:
            audio_path: 音频文件路径
            language: 语言代码（en=英语）
        
        Returns:
            句子列表，每个包含 text, start, end
        """
        try:
            if self.use_faster:
                # faster-whisper API
                segments, info = self.model.transcribe(
                    audio_path,
                    language=language,
                    beam_size=5
                )
                
                sentences = []
                for segment in segments:
                    sentences.append({
                        "text": segment.text.strip(),
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2)
                    })
            else:
                # openai-whisper API - 延迟加载模型
                if self.model is None:
                    print("正在加载Whisper模型（首次使用会下载模型，需要一些时间）...")
                    self.model = _load_whisper_model_with_ssl_fix(self.model_size)
                result = self.model.transcribe(audio_path, language=language)
                
                sentences = []
                for segment in result["segments"]:
                    sentences.append({
                        "text": segment["text"].strip(),
                        "start": round(segment["start"], 2),
                        "end": round(segment["end"], 2)
                    })
            
            return sentences
        except Exception as e:
            raise Exception(f"Whisper转写错误: {str(e)}")
    
    def transcribe_realtime(self, audio_data: bytes, language: str = "en") -> str:
        """
        实时语音识别（用于Role Play）
        
        Args:
            audio_data: 音频数据（bytes）
            language: 语言代码
        
        Returns:
            识别出的文本
        """
        # 保存临时文件
        temp_path = "/tmp/temp_audio.wav"
        with open(temp_path, "wb") as f:
            f.write(audio_data)
        
        try:
            if self.use_faster:
                # faster-whisper API
                segments, _ = self.model.transcribe(
                    temp_path,
                    language=language,
                    beam_size=5
                )
                # 合并所有segments
                text = " ".join([segment.text.strip() for segment in segments])
            else:
                # openai-whisper API - 延迟加载模型
                if self.model is None:
                    print("正在加载Whisper模型（首次使用会下载模型，需要一些时间）...")
                    self.model = _load_whisper_model_with_ssl_fix(self.model_size)
                result = self.model.transcribe(temp_path, language=language)
                text = result["text"].strip()
            
            return text
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
