param(
  [Parameter(Mandatory=$true)]
  [string]$JavaHome
)

$resolved = Resolve-Path -LiteralPath $JavaHome -ErrorAction Stop
$javaExe = Join-Path $resolved.Path "bin\\java.exe"

if (-not (Test-Path -LiteralPath $javaExe)) {
  Write-Error "java.exe not found under '$($resolved.Path)\\bin'."
  exit 1
}

[Environment]::SetEnvironmentVariable("JAVA_HOME", $resolved.Path, "User")

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$javaBin = Join-Path $resolved.Path "bin"

if ($currentPath -notlike "*$javaBin*") {
  $newPath = if ([string]::IsNullOrWhiteSpace($currentPath)) { $javaBin } else { "$currentPath;$javaBin" }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
}

Write-Host "JAVA_HOME set to: $($resolved.Path)"
Write-Host "Reopen terminal and run: cd backend-spring; .\\mvnw.cmd -v"
