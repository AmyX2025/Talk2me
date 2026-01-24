# 项目设置指南

## 📋 前置要求

- Node.js 18+ 
- Python 3.10+
- Groq API Key（已获取）

## 🚀 安装步骤

### 1. 安装前端依赖

```bash
cd frontend
npm install
```

### 2. 安装后端依赖

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Groq API Key：

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./talk2me.db
AUDIO_STORAGE_PATH=./storage/audio
FEEDBACK_STORAGE_PATH=./storage/feedback
```

### 4. 创建必要的目录

```bash
cd backend
mkdir -p storage/audio storage/feedback
```

## 🏃 运行项目

### 启动后端服务器

```bash
cd backend
source venv/bin/activate  # 如果还没激活虚拟环境
uvicorn main:app --reload
```

后端将在 http://localhost:8000 运行
API文档：http://localhost:8000/docs

### 启动前端开发服务器

打开新的终端窗口：

```bash
cd frontend
npm run dev
```

前端将在 http://localhost:3000 运行

## 🧪 测试

### 测试后端API

访问 http://localhost:8000/health 应该返回：
```json
{"status": "healthy"}
```

### 测试前端

访问 http://localhost:3000 应该看到导入播客的页面

## 📝 注意事项

1. **Whisper模型下载**：首次运行时，faster-whisper会自动下载模型（base模型约150MB），需要一些时间

2. **Groq API限制**：确保你的Groq API Key有效且有足够的额度

3. **端口冲突**：如果8000或3000端口被占用，可以修改：
   - 后端：修改 `backend/main.py` 中的端口
   - 前端：修改 `frontend/package.json` 中的dev脚本

## 🐛 常见问题

### 问题1：Python依赖安装失败

**解决方案**：
```bash
# 确保使用Python 3.10+
python --version

# 升级pip
pip install --upgrade pip

# 重新安装
pip install -r requirements.txt
```

### 问题2：Whisper模型下载慢

**解决方案**：
- 使用国内镜像或VPN
- 或者手动下载模型文件

### 问题3：CORS错误

**解决方案**：
- 确保后端CORS配置正确（`backend/main.py`）
- 确保前端请求的URL正确（`http://localhost:8000`）

## 📚 下一步

1. 查看 [MVP技术方案](./MVP_PROPOSAL.md) 了解功能设计
2. 查看 [Role Play设计](./ROLE_PLAY_DESIGN.md) 了解对话机制
3. 开始开发新功能！
