# 快速开始指南

## 🚀 启动项目

### 1. 启动后端

```bash
cd backend

# 创建虚拟环境（如果还没有）
python -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 创建必要的目录
mkdir -p storage/audio storage/feedback

# 创建.env文件并填入你的Groq API Key
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# 启动服务器
uvicorn main:app --reload
```

后端将在 http://localhost:8000 运行

### 2. 启动前端

打开新的终端窗口：

```bash
cd frontend

# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 运行

## 📝 使用流程

### 1. 导入播客
- 访问 http://localhost:3000
- 输入播客链接（例如：All Ears English的RSS链接）
- 点击"开始练习"

**注意**：首次处理播客时，Whisper模型会自动下载（约150MB），需要一些时间。

### 2. 跟读练习
- 在跟读页面，你可以：
  - 点击句子列表中的任意句子播放
  - 使用播放/暂停/复读按钮
  - 选择感兴趣的片段（2-3分钟）

### 3. AI对话
- 选择片段后，点击"开始对话"
- 点击麦克风按钮开始录音
- 说话后再次点击停止录音
- AI会引导你进行自然对话

### 4. 查看反馈
- 对话完成后，点击"完成对话"
- 查看学习反馈报告

## 🐛 常见问题

### 问题1：Whisper模型下载慢
**解决方案**：
- 首次运行会自动下载，请耐心等待
- 或者手动下载模型文件

### 问题2：无法访问麦克风
**解决方案**：
- 确保浏览器允许麦克风权限
- Chrome/Edge：设置 > 隐私和安全 > 网站设置 > 麦克风

### 问题3：WebSocket连接失败
**解决方案**：
- 确保后端服务器正在运行
- 检查防火墙设置
- 确保端口8000没有被占用

### 问题4：Groq API错误
**解决方案**：
- 检查`.env`文件中的API Key是否正确
- 确认API Key有足够的额度
- 检查网络连接

## 📚 测试用的播客链接

### All Ears English RSS
```
https://feeds.simplecast.com/54nAGcIl
```

或者苹果播客链接（需要转换为RSS）：
```
https://podcasts.apple.com/us/podcast/all-ears-english-podcast/id913867348
```

## 🎯 功能说明

### ✅ 已实现功能
1. ✅ 播客导入和文字识别
2. ✅ 跟读练习（播放/暂停/复读）
3. ✅ 片段选择
4. ✅ AI Role Play对话（语音+文字）
5. ✅ 学习反馈生成

### 🔄 待优化功能
- [ ] TTS语音合成（AI回复的语音播放）
- [ ] 对话历史保存
- [ ] 用户系统（登录/注册）
- [ ] 移动端适配

## 💡 提示

1. **首次使用**：处理播客需要一些时间（下载音频+识别文字），请耐心等待
2. **对话技巧**：AI会引导你，用简单句子回答即可，不要紧张
3. **片段选择**：选择2-3分钟的片段效果最好，不要太长或太短

## 📞 需要帮助？

如果遇到问题，请检查：
1. 后端日志（终端1）
2. 前端控制台（浏览器F12）
3. 网络请求（浏览器Network标签）
