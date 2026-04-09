FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖（Prophet 需要编译环境）
RUN apt-get update && apt-get install -y \
    build-essential \
    cmdstanpy \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 创建模型存储目录
RUN mkdir -p /app/models

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
