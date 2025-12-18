# Kimi-Free-API Docker 部署指南

本指南将详细介绍如何将 kimi-free-api 项目构建成 Docker 镜像，并在服务器上部署运行。

## 📋 目录

1. [准备工作](#-准备工作)
2. [本地构建测试](#-本地构建测试)
3. [推送到Docker Hub](#-推送到docker-hub)
4. [服务器部署](#-服务器部署)
5. [常见问题](#-常见问题)
6. [高级配置](#-高级配置)

## 🚀 准备工作

### 1. 安装必要软件

确保你的开发电脑和服务器都已安装：

**开发电脑：**
- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- Git

**服务器：**
- Docker Engine
- Docker Compose (可选，但推荐)

### 2. Docker Hub 账户

如果没有，请先注册：
- 访问 [Docker Hub](https://hub.docker.com/)
- 注册账户并记住你的用户名

### 3. 项目准备

确保项目已经完成并推送到 GitHub：

```bash
# 在项目根目录
git add .
git commit -m "添加Docker部署支持"
git push origin main
```

## 🔧 本地构建测试

### 1. 构建Docker镜像

```bash
# 在项目根目录执行
docker build -t kimi-free-api:latest .

# 或者指定你的Docker Hub用户名
docker build -t yourusername/kimi-free-api:latest .
```

### 2. 测试运行镜像

```bash
# 运行容器
docker run -d \
  --name kimi-test \
  -p 8000:8000 \
  kimi-free-api:latest

# 检查容器状态
docker ps

# 查看日志
docker logs kimi-test

# 测试服务
curl http://localhost:8000/

# 停止测试容器
docker stop kimi-test
docker rm kimi-test
```

### 3. 使用docker-compose测试（推荐）

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f kimi-free-api

# 测试服务
curl http://localhost:8000/

# 停止服务
docker-compose down
```

## 📤 推送到Docker Hub

### 1. 登录Docker Hub

```bash
docker login
# 输入你的Docker Hub用户名和密码
```

### 2. 标记镜像

```bash
# 格式：docker tag 本地镜像名 你的用户名/镜像名:标签
docker tag kimi-free-api:latest yourusername/kimi-free-api:latest

# 如果要添加版本标签
docker tag kimi-free-api:latest yourusername/kimi-free-api:v1.0.0
```

### 3. 推送镜像

```bash
# 推送最新版
docker push yourusername/kimi-free-api:latest

# 推送版本标签
docker push yourusername/kimi-free-api:v1.0.0
```

### 4. 验证推送

在 [Docker Hub](https://hub.docker.com/) 查看你的仓库，确认镜像已成功推送。

## 🖥️ 服务器部署

### 方法一：直接使用Docker命令

#### 1. 登录服务器

```bash
ssh your-user@your-server-ip
```

#### 2. 安装Docker（如果未安装）

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加Docker仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
# 重新登录或执行：newgrp docker
```

**CentOS/RHEL:**
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加Docker仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
```

#### 3. 拉取并运行镜像

```bash
# 拉取镜像
docker pull yourusername/kimi-free-api:latest

# 创建必要的目录
mkdir -p /home/user/kimi-api/logs
mkdir -p /home/user/kimi-api/configs

# 运行容器
docker run -d \
  --name kimi-free-api \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /home/user/kimi-api/logs:/app/logs \
  -v /home/user/kimi-api/configs:/app/configs \
  -e NODE_ENV=production \
  -e PORT=8000 \
  yourusername/kimi-free-api:latest

# 检查运行状态
docker ps
docker logs kimi-free-api
```

### 方法二：使用Docker Compose（推荐）

#### 1. 安装Docker Compose

```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 2. 创建部署目录和文件

```bash
# 创建部署目录
mkdir -p /home/user/kimi-api
cd /home/user/kimi-api

# 创建docker-compose.yml文件
nano docker-compose.yml
```

**docker-compose.yml 内容：**
```yaml
version: '3.8'

services:
  kimi-free-api:
    image: yourusername/kimi-free-api:latest
    container_name: kimi-free-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
      # 添加其他需要的环境变量
    volumes:
      - ./logs:/app/logs
      - ./configs:/app/configs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    name: kimi-network
```

#### 3. 启动服务

```bash
# 创建必要的目录
mkdir -p logs configs

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🔧 配置反向代理（Nginx）

### 1. 安装Nginx

```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

### 2. 配置Nginx

创建配置文件：`sudo nano /etc/nginx/sites-available/kimi-api`

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/kimi-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 🔄 更新部署

### 1. 更新镜像

```bash
# 拉取最新镜像
docker pull yourusername/kimi-free-api:latest

# 停止旧容器
docker stop kimi-free-api

# 删除旧容器
docker rm kimi-free-api

# 使用新镜像启动容器
docker run -d \
  --name kimi-free-api \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /home/user/kimi-api/logs:/app/logs \
  -v /home/user/kimi-api/configs:/app/configs \
  -e NODE_ENV=production \
  -e PORT=8000 \
  yourusername/kimi-free-api:latest
```

### 2. 使用Docker Compose更新

```bash
# 进入部署目录
cd /home/user/kimi-api

# 拉取最新镜像
docker-compose pull

# 重新创建容器
docker-compose up -d --force-recreate

# 查看状态
docker-compose ps
```

## 📊 监控和维护

### 1. 查看服务状态

```bash
# 查看容器状态
docker ps
docker stats kimi-free-api

# 查看日志
docker logs -f kimi-free-api
# 或者使用docker-compose
docker-compose logs -f
```

### 2. 设置自动重启

```bash
# 确保容器设置了重启策略
docker update --restart=unless-stopped kimi-free-api
```

### 3. 备份重要数据

```bash
# 备份日志和配置
tar -czf kimi-api-backup-$(date +%Y%m%d).tar.gz logs configs/
```

## ❓ 常见问题

### Q1: 容器无法启动
```bash
# 查看详细错误信息
docker logs kimi-free-api

# 检查端口是否被占用
sudo netstat -tlnp | grep :8000

# 检查防火墙设置
sudo ufw status
```

### Q2: 无法访问服务
```bash
# 检查容器是否正在运行
docker ps

# 检查端口映射
docker port kimi-free-api

# 测试内部连接
docker exec kimi-free-api curl http://localhost:8000/
```

### Q3: 内存不足
```bash
# 检查内存使用
docker stats

# 限制内存使用
docker run -d --memory=512m kimi-free-api:latest
```

### Q4: 磁盘空间不足
```bash
# 清理无用的Docker资源
docker system prune -a

# 清理无用的镜像
docker image prune -a
```

## 🔐 安全建议

### 1. 使用非root用户运行
Dockerfile中已经配置了非root用户。

### 2. 限制网络访问
```bash
# 创建专用网络
docker network create kimi-network

# 使用专用网络运行
docker run --network=kimi-network kimi-free-api:latest
```

### 3. 定期更新
```bash
# 定期更新基础镜像
docker pull node:18-alpine
# 重新构建和部署
```

### 4. 使用HTTPS
建议配置SSL证书，使用HTTPS访问。

## 📝 自动化部署脚本

创建 `deploy.sh` 脚本：

```bash
#!/bin/bash

# 配置变量
IMAGE_NAME="yourusername/kimi-free-api"
CONTAINER_NAME="kimi-free-api"
PORT="8000"

echo "开始部署 kimi-free-api..."

# 停止旧容器
if [ $(docker ps -q -f name=$CONTAINER_NAME) ]; then
    echo "停止旧容器..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# 拉取最新镜像
echo "拉取最新镜像..."
docker pull $IMAGE_NAME:latest

# 启动新容器
echo "启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:8000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/configs:/app/configs \
  -e NODE_ENV=production \
  -e PORT=8000 \
  $IMAGE_NAME:latest

# 检查状态
echo "检查服务状态..."
sleep 5
if curl -f http://localhost:$PORT/; then
    echo "✅ 部署成功！"
else
    echo "❌ 部署失败，请检查日志："
    docker logs $CONTAINER_NAME
fi

echo "部署完成！"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh
```

这样你就完成了一个完整的Docker部署方案！有任何问题都可以随时询问。