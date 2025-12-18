# 🚀 Kimi-Free-API Docker 快速开始

## 📋 概述

本项目已完整配置 Docker 支持，包含以下文件：

- `Dockerfile` - 多阶段构建的优化Docker镜像
- `docker-compose.yml` - 容器编排配置
- `.dockerignore` - 构建优化配置
- `DOCKER_DEPLOY.md` - 详细部署指南
- `deploy.sh` - 自动化部署脚本
- `.github/workflows/docker.yml` - GitHub Actions自动构建

## 🎯 5分钟快速部署

### 方式一：使用Docker Hub（推荐）

1. **推送到Docker Hub**
   ```bash
   # 1. 登录Docker Hub
   docker login

   # 2. 使用自动脚本构建和推送
   ./deploy.sh your-docker-username

   # 3. 在服务器上拉取和运行
   ssh your-server
   docker run -d --name kimi-free-api -p 8000:8000 --restart unless-stopped your-docker-username/kimi-free-api:latest
   ```

### 方式二：本地构建部署

1. **在本地构建镜像**
   ```bash
   docker build -t kimi-free-api:latest .
   ```

2. **保存镜像并传输到服务器**
   ```bash
   # 保存镜像到文件
   docker save kimi-free-api:latest > kimi-free-api.tar

   # 传输到服务器
   scp kimi-free-api.tar your-server:/home/user/

   # 在服务器上加载镜像
   ssh your-server
   docker load < kimi-free-api.tar
   ```

3. **在服务器运行**
   ```bash
   docker run -d --name kimi-free-api -p 8000:8000 --restart unless-stopped kimi-free-api:latest
   ```

### 方式三：使用docker-compose

1. **在服务器上创建docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     kimi-free-api:
       image: your-docker-username/kimi-free-api:latest
       container_name: kimi-free-api
       restart: unless-stopped
       ports:
         - "8000:8000"
       environment:
         - NODE_ENV=production
         - PORT=8000
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

## 🔧 常用命令

### Docker 基础命令
```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs kimi-free-api

# 进入容器
docker exec -it kimi-free-api sh

# 停止容器
docker stop kimi-free-api

# 启动容器
docker start kimi-free-api

# 删除容器
docker rm kimi-free-api
```

### 服务管理
```bash
# 重启服务
docker restart kimi-free-api

# 查看资源使用情况
docker stats kimi-free-api

# 更新镜像
docker pull your-docker-username/kimi-free-api:latest
docker-compose up -d --force-recreate
```

## 🌐 访问服务

部署完成后，服务将在以下地址可用：

- 直接访问：`http://your-server-ip:8000`
- 如果配置了域名和Nginx：`http://your-domain.com`

## 📊 监控和日志

### 查看服务状态
```bash
# 检查容器状态
docker ps | grep kimi-free-api

# 查看健康检查
docker inspect kimi-free-api | grep Health -A 10

# 实时日志
docker logs -f kimi-free-api
```

### 设置日志轮转
```bash
# 在docker-compose.yml中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔒 安全建议

1. **使用非root用户** ✅ Dockerfile已配置
2. **设置资源限制**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 512M
   ```
3. **配置防火墙**
   ```bash
   sudo ufw allow 8000
   sudo ufw enable
   ```
4. **使用HTTPS**（建议配置Nginx反向代理）

## 🆘 故障排除

### 常见问题
1. **容器无法启动**
   ```bash
   # 查看详细错误
   docker logs kimi-free-api

   # 检查端口占用
   sudo netstat -tlnp | grep :8000
   ```

2. **无法访问服务**
   ```bash
   # 检查端口映射
   docker port kimi-free-api

   # 检查防火墙
   sudo ufw status

   # 测试内部连接
   docker exec kimi-free-api curl http://localhost:8000/
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   docker stats

   # 清理未使用的资源
   docker system prune -a
   ```

## 🔄 自动更新

### 设置GitHub Actions自动构建
1. 在GitHub仓库设置中添加Secrets：
   - `DOCKER_USERNAME` - Docker Hub用户名
   - `DOCKER_PASSWORD` - Docker Hub密码或访问令牌

2. 推送代码到main分支时自动构建镜像

### 服务器自动更新脚本
创建 `update.sh`：
```bash
#!/bin/bash
docker-compose pull
docker-compose up -d --force-recreate
docker system prune -f
echo "更新完成！"
```

## 📚 更多文档

- `DOCKER_DEPLOY.md` - 详细部署指南
- `deploy.sh` - 自动化部署脚本使用说明
- `.github/workflows/docker.yml` - GitHub Actions配置

## 🤝 贡献

如需改进Docker配置，请提交Pull Request或创建Issue。

---

**🎉 恭喜！你现在可以使用Docker快速部署kimi-free-api了！**