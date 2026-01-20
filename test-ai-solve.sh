#!/bin/bash
# AI Solve Endpoint Test Script
# Kullanım: ./test-ai-solve.sh YOUR_JWT_TOKEN YOUR_IMAGE_URL

if [ $# -lt 2 ]; then
    echo "Kullanım: $0 <JWT_TOKEN> <IMAGE_URL> [BASE_URL]"
    echo "Örnek: $0 eyJhbGc... https://example.com/image.jpg"
    exit 1
fi

TOKEN=$1
IMAGE_URL=$2
BASE_URL=${3:-"http://localhost:3000"}

echo "Testing AI Solve endpoint..."
echo "URL: $BASE_URL/api/questions/ai-solve"
echo "Image URL: $IMAGE_URL"
echo ""

curl -X POST "$BASE_URL/api/questions/ai-solve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"questionImageUrl\": \"$IMAGE_URL\",
    \"questionImageKey\": \"test-key\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat
