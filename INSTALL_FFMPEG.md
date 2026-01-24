# 安装 FFmpeg 指南

Whisper需要ffmpeg来处理音频文件。请按照以下步骤安装：

## 方法1：使用Homebrew（推荐）

### 步骤1：安装Homebrew（如果还没有）

打开终端，运行：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

按照提示完成安装。

### 步骤2：安装ffmpeg

```bash
brew install ffmpeg
```

### 步骤3：验证安装

```bash
ffmpeg -version
```

如果看到版本信息，说明安装成功！

---

## 方法2：手动下载（如果不想安装Homebrew）

1. 访问：https://evermeet.cx/ffmpeg/
2. 下载最新版本的ffmpeg
3. 解压后将ffmpeg放到 `/usr/local/bin/` 目录
4. 或者放到项目目录，然后在代码中指定路径

---

## 安装完成后

重启后端服务器：
```bash
cd /Users/amyxie/Documents/CursorProject/Talk2me/backend
pkill -f "uvicorn main:app"
./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

然后就可以正常使用播客导入功能了！
