#!/bin/bash

# 启动后端服务器脚本

cd "$(dirname "$0")/backend"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告：未找到.env文件"
    echo "请先创建.env文件并填入GROQ_API_KEY"
    echo "运行: echo 'GROQ_API_KEY=你的key' > backend/.env"
    exit 1
fi

# 安装依赖
echo "检查依赖..."
pip install -q -r requirements.txt

# 创建必要的目录
mkdir -p storage/audio storage/feedback

# 启动服务器
echo "🚀 启动后端服务器..."
echo "访问 http://localhost:8000/docs 查看API文档"
echo ""
uvicorn main:app --reload
