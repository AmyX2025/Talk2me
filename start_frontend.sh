#!/bin/bash

# 启动前端应用脚本

cd "$(dirname "$0")/frontend"

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动前端应用..."
echo "访问 http://localhost:3000"
echo ""
npm run dev
