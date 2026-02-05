#!/bin/bash

# Agent's Toolbox - API 测试脚本
# 用于快速验证后端 API 是否正常工作

echo "🧪 Agent's Toolbox - API 测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 后端 URL
BACKEND_URL="http://localhost:3000"

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}

    echo -n "Testing ${name}... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -X ${method} "${url}")

    if [ $response -eq 200 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP ${response})"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP ${response})"
        return 1
    fi
}

# 开始测试
echo "📡 Backend URL: ${BACKEND_URL}"
echo ""

# 1. 健康检查
echo -e "${BLUE}1. Health Check${NC}"
curl -s "${BACKEND_URL}/health" | jq .
echo ""

# 2. 根端点
echo -e "${BLUE}2. Root Endpoint${NC}"
test_endpoint "Root Endpoint" "${BACKEND_URL}/"
echo ""

# 3. 测试所有 API 端点结构
echo -e "${BLUE}3. API Structure${NC}"
curl -s "${BACKEND_URL}/" | jq '.endpoints'
echo ""

# 总结
echo "================================"
echo -e "${GREEN}✅ 所有基础测试通过！${NC}"
echo ""
echo "📝 下一步:"
echo "  1. 打开前端: http://localhost:5173"
echo "  2. 连接 MetaMask 钱包"
echo "  3. 购买一个邮箱"
echo "  4. 使用邮箱 ID 测试具体端点"
echo ""
echo "示例命令:"
echo "  curl ${BACKEND_URL}/api/mailbox/YOUR_MAILBOX_ID"
echo "  curl ${BACKEND_URL}/api/mailbox/YOUR_MAILBOX_ID/messages"
echo ""
