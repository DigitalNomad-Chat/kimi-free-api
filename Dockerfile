# 多阶段构建：构建阶段
FROM node:18-alpine AS BUILD_IMAGE

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS PRODUCTION_IMAGE

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=BUILD_IMAGE /app/dist ./dist
COPY --from=BUILD_IMAGE /app/public ./public

# 如果有配置文件目录，也复制过来
COPY --from=BUILD_IMAGE /app/configs ./configs 2>/dev/null || true

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kimi -u 1001

# 更改文件所有权
RUN chown -R kimi:nodejs /app
USER kimi

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# 启动应用
CMD ["npm", "start"]