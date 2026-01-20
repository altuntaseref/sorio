# AI Solve Endpoint Test Script
# Kullanım: .\test-ai-solve.ps1 -Token "YOUR_JWT_TOKEN" -ImageUrl "YOUR_IMAGE_URL"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$ImageUrl,
    
    [string]$BaseUrl = "http://localhost:3000"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$body = @{
    questionImageUrl = $ImageUrl
    questionImageKey = "test-key"  # Şimdilik test için
} | ConvertTo-Json

Write-Host "Testing AI Solve endpoint..." -ForegroundColor Cyan
Write-Host "URL: $BaseUrl/api/questions/ai-solve" -ForegroundColor Gray
Write-Host "Image URL: $ImageUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/questions/ai-solve" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ Error occurred!" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
