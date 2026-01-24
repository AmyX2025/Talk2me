# MVP 技术方案（成本优化版）

## MVP 功能范围

### ✅ 核心功能
1. **播客链接导入**：支持苹果播客链接（All Ears English）
2. **跟读练习**：播放/暂停/复读，用户自主练习（不录音）
3. **片段选择**：用户选择感兴趣的2-3分钟片段
4. **AI Role Play**：基于选定片段进行对话练习
5. **学习反馈**：文字反馈报告（重点句子、单词使用、提升建议）

### ❌ MVP暂不包含
- YouTube链接支持
- 跟读录音和评分
- 用户注册/登录系统
- 手机端适配

## 关于视频功能的建议

### 🤔 是否需要视频？

**建议：MVP阶段先做可选功能**

**视频的优势：**
- ✅ 趣味性更强，学习体验更沉浸
- ✅ 屏幕上可以显示AI的问题和提示
- ✅ 用户可以观察自己的表现（表情、肢体语言）
- ✅ 回看时更有价值

**纯语音的优势：**
- ✅ 开发更简单，成本更低
- ✅ 用户隐私更友好
- ✅ 移动端体验更好（不需要摄像头）
- ✅ 文件存储成本更低

**推荐方案：**
- MVP阶段：**先实现纯语音版本**
- 如果用户反馈需要视频，再快速添加视频功能
- 视频功能可以作为"增强模式"开关，用户可选择开启/关闭

## 成本优化方案

### AI服务选择（按性价比排序）

#### 1. 语音识别（ASR）
**推荐：Whisper（开源）**
- ✅ **完全免费**：使用本地部署的Whisper模型
- ✅ 高精度：与OpenAI Whisper API相同质量
- ✅ 可离线运行：`whisper.cpp` 或 `faster-whisper`
- 💰 成本：$0（服务器算力成本可忽略）

**备选方案：**
- DeepSeek ASR（如果提供，价格可能更低）
- 本地部署：使用 `faster-whisper` + GPU（一次性成本）

#### 2. 对话生成（LLM）
**推荐组合：Groq + DeepSeek**

**Groq（主要使用）：**
- ✅ **极快速度**：推理速度是OpenAI的10-30倍
- ✅ **超低成本**：Llama 3.1 70B模型，$0.27/1M tokens
- ✅ 免费额度：每天有一定免费额度
- ✅ 适合实时对话：低延迟

**DeepSeek（备选）：**
- ✅ **超低价格**：DeepSeek Chat $0.14/1M tokens（输入）
- ✅ 中文支持好：对中文理解更准确
- ✅ API稳定：国内访问友好

**对比OpenAI：**
- GPT-4：$30/1M tokens（输入）→ **成本是Groq的111倍**
- GPT-3.5：$0.50/1M tokens → **成本是Groq的1.8倍**

#### 3. 文本转语音（TTS）
**推荐：本地TTS或低成本API**

**方案A：本地TTS（推荐）**
- ✅ **完全免费**：使用 `coqui-tts` 或 `piper`
- ✅ 离线运行：无需API调用
- ✅ 自然度：现代TTS模型质量已很好
- 💰 成本：$0

**方案B：低成本API**
- Azure TTS：$15/1M字符（相对便宜）
- Google Cloud TTS：$16/1M字符
- DeepSeek TTS（如果提供）

**不推荐：**
- OpenAI TTS：$15/1M字符（虽然质量好，但成本较高）
- ElevenLabs：质量最好但价格昂贵

### 成本对比表

| 功能 | OpenAI方案 | 优化方案 | 节省 |
|------|-----------|---------|------|
| 语音识别 | Whisper API ($0.006/分钟) | 本地Whisper ($0) | **100%** |
| 对话生成 | GPT-4 ($30/1M tokens) | Groq ($0.27/1M tokens) | **99%** |
| 文本转语音 | OpenAI TTS ($15/1M字符) | 本地TTS ($0) | **100%** |
| **月度成本（100用户）** | **$80-170** | **$5-15** | **90%+** |

## 技术架构（MVP版）

### 前端技术栈
- **框架**：Next.js 14 + TypeScript
- **UI**：Tailwind CSS + shadcn/ui
- **音频播放**：Howler.js 或原生 Audio API
- **视频录制**（可选）：MediaRecorder API
- **实时通信**：WebSocket（Socket.io）

### 后端技术栈
- **框架**：Python + FastAPI（推荐，因为Whisper生态更好）
  - 或 Node.js + Express（如果你更熟悉）
- **数据库**：SQLite（MVP阶段足够）+ PostgreSQL（后续扩展）
- **文件存储**：本地文件系统（MVP）→ 云存储（后续）

### AI服务集成

```
┌─────────────────────────────────────────┐
│           前端 (Next.js)                 │
│  ┌──────────┐  ┌──────────┐            │
│  │ 播客导入  │  │ 跟读练习  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ Role Play│  │ 学习反馈  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
              ↕ REST API + WebSocket
┌─────────────────────────────────────────┐
│        后端 (FastAPI/Express)            │
│  ┌──────────┐  ┌──────────┐            │
│  │播客处理API│  │对话API    │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│          AI服务（本地/API）               │
│  ┌──────────┐  ┌──────────┐            │
│  │本地Whisper│  │Groq API  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐                          │
│  │本地TTS   │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
```

## 核心功能实现方案

### 1. 播客导入与处理

**流程：**
```
用户输入苹果播客链接
    ↓
后端解析RSS feed，获取音频URL
    ↓
下载音频文件（mp3/m4a）
    ↓
使用本地Whisper进行语音识别
    ↓
自动分段（基于Whisper的segments）
    ↓
存储：音频文件 + 句子列表（JSON）
    ↓
返回前端：音频URL + 句子列表 + 时间戳
```

**技术实现：**
- **RSS解析**：`feedparser` (Python) 或 `rss-parser` (Node.js)
- **音频下载**：`requests` + `wget`
- **语音识别**：`faster-whisper` (Python) - 本地运行
- **分段**：使用Whisper返回的segments，每个segment是一句话

**代码示例（Python）：**
```python
from faster_whisper import WhisperModel
import feedparser

# 1. 解析播客RSS
feed = feedparser.parse(podcast_url)
audio_url = feed.entries[0].enclosures[0].href

# 2. 下载音频
# ... 下载逻辑

# 3. 语音识别
model = WhisperModel("base", device="cpu")  # 或 "cuda" 如果有GPU
segments, info = model.transcribe("audio.mp3", language="en")

# 4. 分段
sentences = []
for segment in segments:
    sentences.append({
        "text": segment.text,
        "start": segment.start,
        "end": segment.end
    })
```

### 2. 跟读功能（简化版）

**功能需求：**
- ✅ 逐句播放音频
- ✅ 播放/暂停控制
- ✅ 复读功能（重新播放当前句）
- ✅ 显示当前句子文本
- ✅ 用户选择片段（2-3分钟）

**实现方案：**
- 前端音频播放器（Howler.js）
- 句子列表展示，点击播放
- 时间轴显示，用户可拖拽选择片段
- **不需要后端交互**（纯前端功能）

**UI设计：**
```
┌─────────────────────────────────────┐
│  [播放] [暂停] [复读] [选择片段]      │
├─────────────────────────────────────┤
│  📝 当前句子：                        │
│  "Today we're going to talk about..."│
├─────────────────────────────────────┤
│  📋 句子列表：                        │
│  [1] "Welcome to All Ears English"  │
│  [2] "Today we're going to..."      │
│  [3] "Let's start with..."          │
│  ...                                 │
├─────────────────────────────────────┤
│  ⏱️ 时间轴：[========|====]          │
│  选择片段：02:30 - 05:00            │
└─────────────────────────────────────┘
```

### 3. AI Role Play功能

**流程：**
```
用户选择感兴趣的片段（2-3分钟）
    ↓
用户选择要扮演的角色（A主播/B主播）
    ↓
提取该片段的对话内容作为上下文
    ↓
开始对话：
  1. 用户说话 → Whisper识别 → 文本
  2. 发送到Groq API（带角色设定）
  3. AI生成回复 → 本地TTS → 播放
  4. 重复步骤1-3
    ↓
对话结束，生成反馈
```

**角色设定：**
- 从原片段提取两个主播的对话
- 分析对话风格、常用表达
- 创建System Prompt：
```
You are [Host A] from All Ears English podcast. 
Your conversation style: [分析的特征]
Example dialogue:
[原片段中的对话示例]

Continue the conversation naturally based on the context.
```

**技术实现：**
- **语音识别**：本地Whisper（实时识别）
- **对话生成**：Groq API（Llama 3.1 70B）
- **TTS**：本地TTS（coqui-tts或piper）
- **实时通信**：WebSocket

**Groq API示例：**
```python
from groq import Groq

client = Groq(api_key="your-key")
response = client.chat.completions.create(
    model="llama-3.1-70b-versatile",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ],
    temperature=0.7
)
```

### 4. 学习反馈系统

**反馈内容：**
1. **重点句子掌握情况**
   - 用户使用了哪些原片段中的句子
   - 哪些句子没有用上
   - 建议练习的句子

2. **单词使用分析**
   - 原片段中的重点单词
   - 用户是否使用了这些单词
   - 单词使用是否准确

3. **提升建议**
   - 语法错误纠正
   - 表达自然度建议
   - 词汇扩展建议

**实现方式：**
- 使用Groq/DeepSeek分析对话记录
- 对比原片段内容和用户对话
- 生成结构化的文字反馈

**反馈格式：**
```markdown
# 学习反馈报告

## 📝 重点句子掌握情况
✅ 已掌握：
- "I think that's a great point"
- "Let me give you an example"

⚠️ 需要练习：
- "What do you think about..."
- "That reminds me of..."

## 📚 单词使用分析
✅ 已使用：conversation, example, point
⚠️ 未使用：remind, perspective, approach

## 💡 提升建议
1. 语法：注意时态一致性
2. 表达：可以多用连接词（however, therefore）
3. 词汇：尝试使用"perspective"替代"view"
```

## 数据模型（简化版）

```sql
-- 播客内容表
podcasts (
    id, 
    url, 
    title, 
    audio_url, 
    sentences_json,  -- 存储句子列表
    created_at
)

-- 用户选择的片段
segments (
    id,
    podcast_id,
    start_time,
    end_time,
    selected_sentences,  -- 选中的句子ID列表
    created_at
)

-- 对话记录
conversations (
    id,
    segment_id,
    user_role,  -- 'A' or 'B'
    messages_json,  -- 对话消息列表
    created_at
)

-- 学习反馈
feedbacks (
    id,
    conversation_id,
    feedback_text,  -- Markdown格式的反馈
    created_at
)
```

## 开发步骤

### Step 1: 环境搭建（1-2天）
- [ ] 初始化Next.js项目
- [ ] 初始化FastAPI后端
- [ ] 安装依赖（Whisper、Groq SDK等）
- [ ] 配置开发环境

### Step 2: 播客导入功能（2-3天）
- [ ] RSS解析
- [ ] 音频下载
- [ ] Whisper语音识别
- [ ] 句子分段和存储
- [ ] 前端展示

### Step 3: 跟读功能（1-2天）
- [ ] 音频播放器组件
- [ ] 句子列表展示
- [ ] 播放/暂停/复读控制
- [ ] 片段选择功能

### Step 4: AI对话功能（3-4天）
- [ ] 本地Whisper集成（实时识别）
- [ ] Groq API集成
- [ ] 本地TTS集成
- [ ] WebSocket实时通信
- [ ] 角色设定和上下文管理

### Step 5: 反馈系统（2-3天）
- [ ] 对话记录存储
- [ ] Groq分析对话内容
- [ ] 生成反馈报告
- [ ] 前端展示反馈

### Step 6: 测试与优化（2-3天）
- [ ] 端到端测试
- [ ] 性能优化
- [ ] UI/UX优化
- [ ] Bug修复

**总计：约2-3周完成MVP**

## 成本估算（MVP阶段）

### 开发成本
- **服务器**：$5-10/月（VPS，用于运行Whisper和TTS）
- **Groq API**：$0-5/月（免费额度通常足够MVP测试）
- **DeepSeek API**：$0-3/月（备选）
- **存储**：$0（本地存储，MVP阶段）
- **域名/部署**：$0（使用免费服务如Vercel、Railway）

**月度成本：$5-18/月**（相比OpenAI方案节省90%+）

### 后续扩展成本
- 如果用户量增长，考虑：
  - 云存储（S3/R2）：$5-20/月
  - 数据库（PostgreSQL）：$5-15/月
  - CDN（音频文件）：$5-10/月

## 技术选型总结

| 组件 | 技术选择 | 成本 | 理由 |
|------|---------|------|------|
| 前端框架 | Next.js + TypeScript | 免费 | 现代化、SEO友好 |
| 后端框架 | FastAPI (Python) | 免费 | Whisper生态好 |
| 语音识别 | faster-whisper (本地) | $0 | 完全免费，质量高 |
| 对话AI | Groq (Llama 3.1) | 极低 | 速度快，成本低 |
| 文本转语音 | coqui-tts (本地) | $0 | 免费，质量好 |
| 数据库 | SQLite → PostgreSQL | 免费→低 | MVP用SQLite足够 |
| 部署 | Vercel + Railway | 免费→低 | 免费额度充足 |

## 下一步行动

1. ✅ **确认技术方案**：是否同意使用Groq + 本地Whisper/TTS？
2. ✅ **确认视频功能**：MVP先做纯语音，还是直接加入视频？
3. ✅ **开始开发**：搭建项目结构，开始实现功能

---

## 总结

这个MVP方案通过以下方式大幅降低成本：
- ✅ 使用本地Whisper（免费）替代OpenAI Whisper API
- ✅ 使用Groq（$0.27/1M tokens）替代GPT-4（$30/1M tokens）
- ✅ 使用本地TTS（免费）替代OpenAI TTS API
- ✅ **成本降低90%+**，从$80-170/月降至$5-18/月

同时保持功能完整性，所有核心需求都能实现。
