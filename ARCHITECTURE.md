# Talk2Me 系统架构说明 (System Architecture)

这份文档旨在帮助你理解 Talk2Me 应用程序的构成、各部分的作用以及为什么需要分别部署。

## 1. 核心模块构成 (Architecture Overview)

你的 App 由两个主要部分组成：“前端 (Frontend)” 和 “后端 (Backend)”。它们就像餐厅的“前厅”和“后厨”。

```mermaid
graph TD
    User((用户/手机)) -->|访问网页 (UI)| Frontend[Frontend (前端)]
    Frontend -->|发送音频/请求| Backend[Backend (后端)]
    
    subgraph "前端 (Vercel)"
        NextJS[Next.js 页面]
        UI[界面/按钮/动画]
    end

    subgraph "后端 (Render)"
        FastAPI[FastAPI 服务器]
        Whisper[语音识别 (AI)]
        FFmpeg[音频处理工具]
        Download[播客下载模块]
    end

    Backend -->|调用| OpenAI[OpenAI/Groq API]
    Backend -->|调用| RSS[Apple Podcasts RSS]
```

### 🏛️ 前端 (Frontend) - "餐厅前厅"
*   **技术栈**: Next.js (React), Tailwind CSS
*   **部署位置**: **Vercel**
*   **作用**: 
    *   负责“颜值”：展示漂亮的界面、按钮、动画。
    *   负责“交互”：用户点击录音、点击播放。
    *   **局限性**: 它是运行在用户的浏览器（手机/电脑）里的，**没有**强大的计算能力，也不能直接安装复杂的系统软件（如 FFmpeg）。

### 🏭 后端 (Backend) - "中央厨房"
*   **技术栈**: Python, FastAPI, Faster-Whisper, FFmpeg
*   **部署位置**: **Render** (计划中)
*   **作用**: 
    *   **脏活累活**: 下载几百兆的播客音频、转换音频格式。
    *   **核心计算**: 运行 AI 模型 (Whisper) 把声音转成文字。
    *   **安全**: 保护你的 API Key (OpenAI Key 等) 不暴露给用户。
*   **为什么必须有后端？**
    *   手机浏览器无法运行 Python 代码。
    *   `Faster-Whisper` 和 `FFmpeg` 需要依赖底层的操作系统库，必须跑在一个真正的服务器环境里。

---

## 2. 为什么要部署后端？(Why Deploy?)

目前你的 App 状况：
*   ✅ **前端已部署**：Vercel 帮你把网页发布到了公网，大家都能看到界面。
*   ❌ **后端未部署**：网页上的功能（如下载播客）试图连接 `http://localhost:8000`。
    *   `localhost` 意思是“本机”。
    *   当你在自己电脑上打开网页时，它能连上你电脑上运行的 Python 后端，所以能用。
    *   **但是**，当我在我的手机上打开你的网页时，我的手机会尝试连接**我的手机的** `localhost`，当然找不到你的 Python 服务，所以报错 "Failed to fetch"。

**解决方案**: 
我们需要把你的 Python 代码也放到互联网上的一台电脑（服务器）上，并给它一个公网地址（比如 `https://talk2me-backend.onrender.com`）。这样，无论谁打开网页，都会向这个公网地址发送请求。

---

## 3. Render vs Supabase：有什么区别？

你问到了 Supabase，这是一个很好的问题。

### 🔹 Supabase
*   **定位**: "后端即服务" (BaaS)。
*   **擅长**: 
    *   它可以直接给你提供一个**数据库** (Postgres)。
    *   它可以帮你管理**用户登录** (Auth)。
    *   它可以存简单的文件。
*   **短板**: 它主要用来存数据。它**不能**运行长时间的 Python 任务，也无法安装像 `FFmpeg` 这样的系统级音频处理工具。它只支持简单的 JavaScript/TypeScript 代码片段（Edge Functions）。
*   **结论**: 对 Talk2Me 这种需要**强音频处理**和**Python AI 模型**的应用，Supabase 不够用。

### 🔸 Render (我们选择的)
*   **定位**: "平台即服务" (PaaS)。
*   **擅长**: 
    *   它给你一个**Docker 容器**（就像一台虚拟的小电脑）。
    *   你可以完全自定义环境：安装 Python、安装 C++ 库、安装 FFmpeg。
    *   你可以运行任何你写的代码。
*   **结论**: 它是部署 Python + FFmpeg 应用的完美且免费（或低成本）的选择。

## 4. 总结：我们需要做什么？

为了让大家都能用上 App，我们需要补全“后厨”的部署：

1.  **打包后端**: 写一个 `Dockerfile`，告诉服务器怎么安装 Python 和 FFmpeg。
2.  **上传 Render**: 把代码推送到 Render 平台。
3.  **连接前后端**: 拿到 Render 给的后端网址，更新到 Vercel 的前端设置里。

这样，整个链路就通了！
