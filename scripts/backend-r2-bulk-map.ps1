param(
  [string]$BaseUrl = "http://127.0.0.1:8787",
  [string]$AdminUserId = "usr_admin_001"
)

$loginBody = @{ userId = $AdminUserId } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/v1/auth/login" -ContentType "application/json" -Body $loginBody
$token = $login.data.session_token
if (-not $token) {
  throw "failed to fetch admin session token"
}

$headers = @{ Authorization = "Bearer $token" }

Write-Host "[1/2] Audit missing lecture_video_asset mappings"
$audit = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/v1/admin/media/r2-mappings/audit" -Headers $headers
$audit | ConvertTo-Json -Depth 6 | Write-Output

Write-Host "[2/2] Bulk-map missing lecture_video_asset mappings"
$mapped = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/v1/admin/media/r2-mappings/bulk-map" -Headers $headers
$mapped | ConvertTo-Json -Depth 6 | Write-Output
