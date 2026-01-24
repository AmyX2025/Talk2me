"""
播客处理服务
解析RSS feed，下载音频，处理内容
"""
import feedparser
import requests
import os
from typing import Dict, List
from app.config import settings

# 延迟导入Whisper，如果未安装则使用占位符
try:
    from app.services.whisper_service import WhisperService
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("警告: faster-whisper未安装，语音识别功能将不可用")

class PodcastService:
    def __init__(self):
        if WHISPER_AVAILABLE:
            self.whisper = WhisperService()
        else:
            self.whisper = None
        os.makedirs(settings.audio_storage_path, exist_ok=True)
    
    def _convert_apple_podcast_url(self, url: str) -> str:
        """
        将苹果播客网页链接转换为RSS feed链接
        
        Args:
            url: 苹果播客网页链接，例如：
                https://podcasts.apple.com/us/podcast/all-ears-english-podcast/id751574016
        
        Returns:
            RSS feed链接
        """
        import re
        # 提取播客ID（匹配/id后面的数字）
        match = re.search(r'/id(\d+)', url)
        if match:
            podcast_id = match.group(1)
            
            # All Ears English的特殊处理
            # ID可能是75157, 751574016等
            if "all-ears-english" in url.lower() or podcast_id.startswith("75157"):
                # 优先使用苹果播客RSS（包含音频文件）
                # 如果失败，再尝试官方RSS
                return f"https://podcasts.apple.com/podcast/id{podcast_id}?mt=2"
            
            # 其他播客：尝试iTunes RSS链接
            rss_url = f"https://podcasts.apple.com/podcast/id{podcast_id}?mt=2"
            return rss_url
        return url
    
    def _extract_episode_id(self, url: str) -> str:
        """
        从苹果播客URL中提取单集ID
        
        Args:
            url: 苹果播客链接，例如：
                https://podcasts.apple.com/cn/podcast/.../id751574016?i=1000746166664
        
        Returns:
            单集ID，如果没有则返回None
        """
        import re
        match = re.search(r'[?&]i=(\d+)', url)
        return match.group(1) if match else None
    
    def _find_episode_in_feed(self, feed, episode_id: str):
        """
        在RSS feed中查找指定的单集
        
        Args:
            feed: feedparser解析的feed对象
            episode_id: 单集ID（苹果播客的单集ID）
        
        Returns:
            找到的entry，如果没找到返回None
        """
        if not episode_id:
            return None
        
        # 在feed中查找匹配的单集
        # 单集ID可能在entry.link、entry.id或entry.guid中
        for entry in feed.entries:
            # 检查link中是否包含单集ID
            if episode_id in entry.get('link', ''):
                return entry
            # 检查id或guid中是否包含
            if episode_id in entry.get('id', '') or episode_id in str(entry.get('guid', '')):
                return entry
        
        return None
    
    def _download_with_ytdlp(self, url: str, save_path: str) -> str:
        """
        使用yt-dlp下载苹果播客音频
        
        Args:
            url: 苹果播客链接
            save_path: 保存路径（目录）
        
        Returns:
            下载的音频文件路径
        """
        try:
            import yt_dlp
            import os
            
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(save_path, '%(title)s.%(ext)s'),
                'quiet': False,
                'no_warnings': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                # 获取下载的文件路径
                filename = ydl.prepare_filename(info)
                # yt-dlp会自动添加扩展名，但可能不一致
                if not os.path.exists(filename):
                    # 尝试查找实际下载的文件
                    base_name = os.path.splitext(filename)[0]
                    for ext in ['.mp3', '.m4a', '.webm', '.opus']:
                        if os.path.exists(base_name + ext):
                            return base_name + ext
                return filename
        except ImportError:
            raise Exception("yt-dlp未安装，请运行: pip install yt-dlp")
        except Exception as e:
            raise Exception(f"yt-dlp下载失败: {str(e)}")
    
    def process_podcast_url(self, podcast_url: str) -> Dict:
        """
        处理播客URL
        
        Args:
            podcast_url: 播客链接（苹果播客网页链接或RSS feed）
        
        Returns:
            包含音频URL和句子列表的字典
        """
        # 提取单集ID（如果URL中包含）
        episode_id = self._extract_episode_id(podcast_url)
        original_url = podcast_url
        
        # 如果是苹果播客网页链接，转换为RSS
        if 'podcasts.apple.com' in podcast_url and '/podcast/' in podcast_url:
            if '?mt=2' not in podcast_url and '/id' in podcast_url:
                podcast_url = self._convert_apple_podcast_url(podcast_url)
        
        # 解析RSS feed - 使用requests避免SSL证书问题
        import ssl
        import urllib.request
        import warnings
        
        # 禁用SSL警告
        warnings.filterwarnings('ignore', message='Unverified HTTPS request')
        
        # 尝试多个RSS源
        rss_sources = []
        if 'podcasts.apple.com' in podcast_url and '?mt=2' in podcast_url:
            # 如果已经是苹果RSS，直接使用
            rss_sources = [podcast_url]
        elif 'podcasts.apple.com' in original_url:
            # 如果是苹果播客链接，尝试多个RSS源
            import re
            match = re.search(r'/id(\d+)', original_url)
            if match:
                podcast_id = match.group(1)
                rss_sources = [
                    f"https://podcasts.apple.com/podcast/id{podcast_id}?mt=2",  # 苹果RSS
                    "https://www.allearsenglish.com/feed/",  # 官方RSS（备用）
                ]
        else:
            rss_sources = [podcast_url]
        
        feed = None
        last_error = None
        
        for rss_url in rss_sources:
            try:
                print(f"尝试RSS源: {rss_url}")
                # 优先使用requests（禁用SSL验证）
                response = requests.get(rss_url, verify=False, timeout=60, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }, stream=True)
                response.raise_for_status()
                # 读取完整内容
                content = b''
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        content += chunk
                feed = feedparser.parse(content)
                
                # 检查是否有单集
                if feed.entries:
                    print(f"✅ RSS源可用: {rss_url}")
                    break
            except Exception as e:
                last_error = e
                print(f"⚠️ RSS源失败: {rss_url} - {str(e)[:100]}")
                continue
        
        # 如果RSS feed解析失败，且原始URL是苹果播客链接，直接使用yt-dlp
        if (not feed or not feed.entries) and 'podcasts.apple.com' in original_url:
            print("⚠️ RSS feed解析失败，尝试使用yt-dlp直接从苹果播客下载...")
            try:
                import hashlib
                # 使用yt-dlp下载
                audio_path = self._download_with_ytdlp(original_url, settings.audio_storage_path)
                print(f"✅ yt-dlp下载成功: {audio_path}")
                
                # 获取标题（yt-dlp会返回信息）
                import yt_dlp
                ydl_opts = {'quiet': True, 'no_warnings': True}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(original_url, download=False)
                    title = info.get('title', 'Unknown')
                
                # 使用Whisper转写
                if not self.whisper:
                    raise Exception("Whisper未安装，请运行: pip install faster-whisper")
                sentences = self.whisper.transcribe(audio_path)
                
                audio_filename = os.path.basename(audio_path)
                return {
                    "title": title,
                    "audio_url": f"/audio/{audio_filename}",
                    "audio_path": audio_path,
                    "sentences": sentences,
                    "duration": sentences[-1]["end"] if sentences else 0
                }
            except Exception as e:
                raise Exception(f"yt-dlp下载失败: {str(e)}")
        
        if not feed or not feed.entries:
            if last_error:
                raise Exception(f"无法解析播客链接: {str(last_error)}")
            else:
                raise Exception("无法解析播客链接，请检查URL是否正确")
        
        # 如果指定了单集ID，尝试查找对应的单集
        if episode_id:
            entry = self._find_episode_in_feed(feed, episode_id)
            if entry:
                print(f"✅ 找到指定单集: {entry.title}")
            else:
                # 如果RSS feed中没有找到单集ID，使用最新一集
                # （因为RSS feed可能不包含所有历史单集，或者单集ID格式不同）
                print(f"⚠️ 未在RSS feed中找到单集ID {episode_id}")
                print(f"   使用RSS feed中的最新一集: {feed.entries[0].title}")
                entry = feed.entries[0]
        else:
            # 没有指定单集ID，使用最新一集
            entry = feed.entries[0]
        
        print(f"\n📻 处理单集: {entry.title}")
        print(f"   发布时间: {entry.get('published', 'N/A')}")
        
        # 获取音频URL或直接下载
        audio_url = None
        audio_path = None
        
        # 方法1: 从enclosures获取（标准RSS）
        if entry.enclosures:
            audio_url = entry.enclosures[0].href
        
        # 方法2: 如果原始URL是苹果播客链接且没有enclosures，使用yt-dlp直接下载
        if not audio_url and 'podcasts.apple.com' in original_url:
            print("⚠️ RSS feed中没有音频文件链接，使用yt-dlp直接从苹果播客下载...")
            try:
                import hashlib
                safe_title = "".join(c for c in entry.title if c.isalnum() or c in (' ', '-', '_')).strip()[:50]
                audio_id = hashlib.md5(entry.id.encode()).hexdigest()[:8]
                audio_filename = f"{safe_title}_{audio_id}"
                audio_filename = audio_filename.replace(" ", "_")
                
                # 使用yt-dlp下载
                audio_path = self._download_with_ytdlp(original_url, settings.audio_storage_path)
                print(f"✅ yt-dlp下载成功: {audio_path}")
            except Exception as e:
                print(f"⚠️ yt-dlp下载失败: {e}")
                # 继续尝试其他方法
        
        # 方法3: 如果没有enclosures且yt-dlp失败，尝试从网页提取或使用iTunes API
        if not audio_url and not audio_path:
            print("⚠️ 尝试其他方法获取音频...")
            
            # 尝试使用iTunes API
            if 'podcasts.apple.com' in original_url and episode_id:
                try:
                    audio_url = self._get_audio_from_itunes_api(episode_id)
                    if audio_url:
                        print(f"✅ 从iTunes API获取音频URL成功")
                except Exception as e:
                    print(f"⚠️ iTunes API获取失败: {e}")
            
            # 尝试从网页中提取
            if not audio_url and entry.link:
                try:
                    audio_url = self._extract_audio_from_webpage(entry.link)
                    if audio_url:
                        print(f"✅ 从网页提取音频URL成功")
                except Exception as e:
                    print(f"⚠️ 网页提取失败: {e}")
        
        # 如果还是没有音频，报错
        if not audio_url and not audio_path:
            raise Exception("未找到音频文件。RSS feed中可能不包含音频链接，请尝试使用其他播客源或直接提供音频文件URL。")
        
        # 如果使用URL下载，需要下载音频
        if audio_url and not audio_path:
            import hashlib
            safe_title = "".join(c for c in entry.title if c.isalnum() or c in (' ', '-', '_')).strip()[:50]
            audio_id = hashlib.md5(entry.id.encode()).hexdigest()[:8]
            audio_filename = f"{safe_title}_{audio_id}.mp3"
            audio_filename = audio_filename.replace(" ", "_")
            audio_path = os.path.join(settings.audio_storage_path, audio_filename)
            
            self._download_audio(audio_url, audio_path)
        
        # 使用Whisper转写
        if not self.whisper:
            raise Exception("Whisper未安装，请运行: pip install faster-whisper")
        sentences = self.whisper.transcribe(audio_path)
        
        # 获取音频文件名（用于URL）
        audio_filename = os.path.basename(audio_path)
        
        return {
            "title": entry.title,
            "audio_url": f"/audio/{audio_filename}",
            "audio_path": audio_path,
            "sentences": sentences,
            "duration": sentences[-1]["end"] if sentences else 0
        }
    
    def _get_audio_from_itunes_api(self, episode_id: str) -> str:
        """
        使用iTunes API获取单集音频URL
        
        Args:
            episode_id: 苹果播客单集ID
        
        Returns:
            音频URL，如果失败返回None
        """
        try:
            # iTunes API查找单集
            api_url = f"https://itunes.apple.com/lookup?id={episode_id}"
            response = requests.get(api_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('results') and len(data['results']) > 0:
                    # 单集信息中可能包含音频URL
                    result = data['results'][0]
                    if 'previewUrl' in result:
                        return result['previewUrl']
        except Exception as e:
            print(f"iTunes API错误: {e}")
        return None
    
    def _extract_audio_from_webpage(self, webpage_url: str) -> str:
        """
        从网页中提取音频URL
        
        Args:
            webpage_url: 单集网页链接
        
        Returns:
            音频URL，如果失败返回None
        """
        import re
        import ssl
        import urllib.request
        import warnings
        warnings.filterwarnings('ignore')
        
        try:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            req = urllib.request.Request(webpage_url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
                html = response.read().decode('utf-8', errors='ignore')
            
            # 查找音频URL模式
            patterns = [
                r'["\'](https?://[^"\']*\.(?:mp3|m4a|wav|ogg)[^"\']*)["\']',
                r'audioUrl["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                r'<audio[^>]*src=["\']([^"\']+)["\']',
                r'<source[^>]*src=["\']([^"\']+)["\']',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for match in matches:
                    if any(ext in match.lower() for ext in ['.mp3', '.m4a', '.wav', '.ogg', 'audio', 'podcast']):
                        return match
        except Exception as e:
            print(f"网页提取错误: {e}")
        return None
    
    def _download_audio(self, url: str, save_path: str):
        """下载音频文件"""
        response = requests.get(url, stream=True, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
