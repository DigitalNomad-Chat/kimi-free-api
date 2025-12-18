#!/bin/bash

# Kimi-Free-API Docker 快速部署脚本
# 使用方法：./deploy.sh [your-docker-username]

set -e

# 配置变量
DOCKER_USERNAME=${1:-"yourusername"}
IMAGE_NAME="kimi-free-api"
TAG="latest"
CONTAINER_NAME="kimi-free-api"
PORT="8000"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_success "Docker 已安装"
}

# 检查Docker是否运行
check_docker_running() {
    if ! docker info &> /dev/null; then
        log_error "Docker 未运行，请启动 Docker 服务"
        exit 1
    fi
    log_success "Docker 正在运行"
}

# 构建镜像
build_image() {
    log_info "开始构建 Docker 镜像..."

    if docker build -t ${IMAGE_NAME}:${TAG} .; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 测试镜像
test_image() {
    log_info "测试镜像..."

    # 停止并删除已存在的测试容器
    if [ $(docker ps -q -f name=test-${CONTAINER_NAME}) ]; then
        docker stop test-${CONTAINER_NAME} > /dev/null 2>&1
        docker rm test-${CONTAINER_NAME} > /dev/null 2>&1
    fi

    # 启动测试容器
    if docker run -d --name test-${CONTAINER_NAME} -p ${PORT}:8000 ${IMAGE_NAME}:${TAG}; then
        log_success "测试容器启动成功"

        # 等待服务启动
        log_info "等待服务启动..."
        sleep 10

        # 测试健康检查
        if curl -f http://localhost:${PORT}/ > /dev/null 2>&1; then
            log_success "健康检查通过"
        else
            log_warning "健康检查失败，但容器仍在运行"
        fi

        # 停止测试容器
        docker stop test-${CONTAINER_NAME} > /dev/null 2>&1
        docker rm test-${CONTAINER_NAME} > /dev/null 2>&1
    else
        log_error "测试容器启动失败"
        exit 1
    fi
}

# 标记镜像
tag_image() {
    if [ "$DOCKER_USERNAME" != "yourusername" ]; then
        log_info "标记镜像为 ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
        docker tag ${IMAGE_NAME}:${TAG} ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}
        log_success "镜像标记完成"
    else
        log_warning "使用默认镜像名称，跳过标记步骤"
        log_warning "要推送到 Docker Hub，请指定你的用户名: ./deploy.sh yourusername"
    fi
}

# 推送镜像
push_image() {
    if [ "$DOCKER_USERNAME" != "yourusername" ]; then
        log_info "推送镜像到 Docker Hub..."

        # 检查是否已登录 Docker Hub
        if ! docker info | grep -q "Username.*${DOCKER_USERNAME}"; then
            log_warning "请先登录 Docker Hub: docker login"
            read -p "是否现在登录? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker login
            else
                log_info "跳过推送步骤"
                return
            fi
        fi

        if docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}; then
            log_success "镜像推送成功"
        else
            log_error "镜像推送失败"
            exit 1
        fi
    else
        log_info "跳过推送步骤（需要指定 Docker Hub 用户名）"
    fi
}

# 显示使用说明
show_usage() {
    echo "使用方法:"
    echo "  ./deploy.sh                    # 本地构建和测试"
    echo "  ./deploy.sh yourusername       # 构建、测试并推送到 Docker Hub"
    echo ""
    echo "部署到服务器:"
    echo "  1. 推送到 Docker Hub 后，在服务器上运行:"
    echo "     docker pull yourusername/kimi-free-api:latest"
    echo "     docker run -d --name kimi-free-api -p 8000:8000 yourusername/kimi-free-api:latest"
    echo ""
    echo "  2. 或者使用 docker-compose:"
    echo "     docker-compose up -d"
}

# 显示部署信息
show_deploy_info() {
    if [ "$DOCKER_USERNAME" != "yourusername" ]; then
        log_info "部署信息:"
        echo "  镜像名称: ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
        echo "  容器名称: ${CONTAINER_NAME}"
        echo "  端口: ${PORT}"
        echo ""
        echo "服务器部署命令:"
        echo "  docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
        echo "  docker run -d \\"
        echo "    --name ${CONTAINER_NAME} \\"
        echo "    --restart unless-stopped \\"
        echo "    -p ${PORT}:8000 \\"
        echo "    ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "  Kimi-Free-API Docker 部署脚本"
    echo "========================================"
    echo ""

    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi

    log_info "开始部署流程..."

    # 检查环境
    check_docker
    check_docker_running

    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi

    log_success "项目环境检查通过"

    # 执行部署步骤
    build_image
    test_image
    tag_image
    push_image

    log_success "部署流程完成！"
    show_deploy_info

    echo ""
    log_info "查看 DOCKER_DEPLOY.md 获取详细部署指南"
}

# 运行主函数
main "$@"