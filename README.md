# Talk2Me - 英语口语练习平台

一个专注于听力和口语练习的英语学习平台，通过跟读和AI对话实现输入到输出的完整学习闭环。

## 🎯 **新用户请先看这里！**

👉 **[START_HERE.md](./START_HERE.md) - 完整的启动指南**

或者使用快速启动脚本：
- `./start_backend.sh` - 启动后端
- `./start_frontend.sh` - 启动前端

然后访问：**http://localhost:3000**

## 🎯 项目目标

帮助英语学习者通过：
1. **跟读练习**：模仿播客内容，提升发音和流利度
2. **AI Role Play**：与AI进行自然对话，内化学习内容
3. **学习反馈**：获得个性化的学习建议和改进方向

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- Python 3.10+
- Groq API Key（已获取）

### 安装步骤

#### 1. 安装前端依赖

```bash
cd frontend
npm install
```

#### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 3. 配置环境变量

创建 `backend/.env` 文件：

```env
GROQ_API_KEY=your_api_key_here

```

#### 4. 启动开发服务器

**前端：**
```bash
cd frontend
npm run dev
```
访问 http://localhost:3000

**后端：**
```bash
cd backend
uvicorn main:app --reload
```
API文档：http://localhost:8000/docs

## 📁 项目结构

```
Talk2me/
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/      # Next.js App Router
│   │   ├── components/  # React 组件
│   │   └── lib/      # 工具函数
│   └── package.json
│
├── backend/          # FastAPI 后端应用
│   ├── app/
│   │   ├── api/      # API 路由
│   │   ├── services/ # 业务逻辑
│   │   └── models/   # 数据模型
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

## 🛠️ 技术栈

### 前端
- **框架**：Next.js 14 + TypeScript
- **UI**：Tailwind CSS + shadcn/ui
- **音频**：Howler.js
- **实时通信**：WebSocket (Socket.io)

### 后端
- **框架**：Python + FastAPI
- **语音识别**：faster-whisper (本地)
- **对话AI**：Groq API (Llama 3.1)
- **文本转语音**：coqui-tts (本地)
- **数据库**：SQLite (MVP阶段)

## 📝 功能说明

### MVP 功能

1. **播客导入**
   - 支持苹果播客链接
   - 自动下载音频并识别文字

2. **跟读练习**
   - 逐句播放
   - 播放/暂停/复读控制
   - 显示字幕

3. **AI Role Play**
   - 选择感兴趣的片段
   - 与AI进行自然对话
   - 实时语音识别和反馈

4. **学习反馈**
   - 文字反馈报告
   - 重点句子和单词分析
   - 提升建议

## 🔧 开发指南

### 添加新功能

1. 前端：在 `frontend/src/app` 或 `frontend/src/components` 中添加
2. 后端：在 `backend/app/api` 中添加新的路由

### 代码规范

- 前端：使用 ESLint + Prettier
- 后端：使用 Black + isort

## 📄 文档

- [MVP技术方案](./MVP_PROPOSAL.md)
- [Role Play设计](./ROLE_PLAY_DESIGN.md)
- [完整技术方案](./TECHNICAL_PROPOSAL.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License
