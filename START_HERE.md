# 🚀 开始测试 - 完整指南

## 📍 项目位置

你的应用在：`/Users/amyxie/Documents/CursorProject/Talk2me/`

包含两个部分：
- **前端**：`frontend/` - Next.js网页应用
- **后端**：`backend/` - FastAPI服务器

## ⚡ 快速启动（3步）

### 第1步：配置后端环境变量

```bash
cd /Users/amyxie/Documents/CursorProject/Talk2me/backend
```

创建 `.env` 文件并填入你的Groq API Key：

```bash
echo "GROQ_API_KEY=你的groq_api_key" > .env
```

**重要**：把 `你的groq_api_key` 替换成你实际的Groq API Key！

### 第2步：启动后端服务器

打开**第一个终端窗口**：

```bash
cd /Users/amyxie/Documents/CursorProject/Talk2me/backend

# 创建虚拟环境（如果还没有）
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖（首次需要）
pip install -r requirements.txt

# 创建必要的目录
mkdir -p storage/audio storage/feedback

# 启动服务器
uvicorn main:app --reload
```

看到类似这样的输出就说明后端启动成功了：
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**保持这个终端窗口打开！**

### 第3步：启动前端应用

打开**第二个终端窗口**（新开一个）：

```bash
cd /Users/amyxie/Documents/CursorProject/Talk2me/frontend

# 安装依赖（首次需要）
npm install

# 启动开发服务器
npm run dev
```

看到类似这样的输出就说明前端启动成功了：
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

## 🌐 访问应用

打开浏览器，访问：**http://localhost:3000**

你会看到Talk2Me的首页！

## 🧪 测试流程

### 1. 导入播客
- 在首页输入播客链接
- 例如：`https://feeds.simplecast.com/54nAGcIl` (All Ears English)
- 点击"开始练习"
- **注意**：首次处理会下载Whisper模型（约150MB），需要几分钟

### 2. 跟读练习
- 点击句子列表中的任意句子
- 使用播放/暂停/复读按钮
- 选择感兴趣的片段（2-3分钟）

### 3. AI对话
- 选择片段后点击"开始对话"
- 点击麦克风按钮开始录音
- 说话后再次点击停止
- AI会引导你进行对话

### 4. 查看反馈
- 对话完成后点击"完成对话"
- 查看学习反馈报告

## 🐛 常见问题

### Q: 后端启动失败？
**检查：**
- Python版本：`python3 --version` 应该是3.10+
- 虚拟环境是否激活：命令行前面应该有 `(venv)`
- 依赖是否安装：`pip list | grep fastapi`

### Q: 前端启动失败？
**检查：**
- Node.js版本：`node --version` 应该是18+
- 依赖是否安装：`ls node_modules` 应该有内容

### Q: 无法访问 http://localhost:3000？
**检查：**
- 前端是否正在运行（看第二个终端）
- 端口3000是否被占用：`lsof -i :3000`

### Q: API调用失败？
**检查：**
- 后端是否正在运行（看第一个终端）
- `.env`文件中的Groq API Key是否正确
- 浏览器控制台（F12）查看错误信息

### Q: Whisper模型下载慢？
**正常现象**：首次使用会自动下载模型（约150MB），请耐心等待

## 📝 测试用的播客链接

### All Ears English RSS
```
https://feeds.simplecast.com/54nAGcIl
```

### 其他RSS链接
任何有效的播客RSS链接都可以使用

## 🎯 下一步

1. ✅ 确保两个服务器都在运行
2. ✅ 访问 http://localhost:3000
3. ✅ 输入播客链接测试
4. ✅ 尝试所有功能

## 💡 提示

- **保持两个终端窗口都打开**：一个运行后端，一个运行前端
- **首次使用需要时间**：Whisper模型下载和音频处理需要一些时间
- **允许麦克风权限**：对话功能需要浏览器麦克风权限

---

**需要帮助？** 查看：
- [QUICK_START.md](./QUICK_START.md) - 快速开始
- [SETUP.md](./SETUP.md) - 详细设置
- [FEATURES.md](./FEATURES.md) - 功能说明
