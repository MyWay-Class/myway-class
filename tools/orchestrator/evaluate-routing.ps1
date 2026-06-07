param(
  [string]$InputCsv = "_workspace/harness-routing-eval.csv",
  [string]$OutJson = "_workspace/harness-routing-eval-summary.json"
)

if (-not (Test-Path $InputCsv)) {
  Write-Error "Input CSV not found: $InputCsv"
  exit 1
}

$rows = Import-Csv -Path $InputCsv
if (-not $rows -or $rows.Count -eq 0) {
  Write-Error "Input CSV is empty: $InputCsv"
  exit 1
}

$tp = ($rows | Where-Object { $_.classification -eq "TP" } | Measure-Object).Count
$tn = ($rows | Where-Object { $_.classification -eq "TN" } | Measure-Object).Count
$fp = ($rows | Where-Object { $_.classification -eq "FP" } | Measure-Object).Count
$fn = ($rows | Where-Object { $_.classification -eq "FN" } | Measure-Object).Count
$total = $rows.Count

$safeDiv = {
  param([double]$a, [double]$b)
  if ($b -eq 0) { return 0.0 }
  return [math]::Round(($a / $b), 4)
}

$accuracy = & $safeDiv ($tp + $tn) $total
$precision = & $safeDiv $tp ($tp + $fp)
$recall = & $safeDiv $tp ($tp + $fn)
$f1 = if (($precision + $recall) -eq 0) { 0.0 } else { [math]::Round((2 * $precision * $recall) / ($precision + $recall), 4) }
$falsePositiveRate = & $safeDiv $fp ($fp + $tn)
$falseNegativeRate = & $safeDiv $fn ($fn + $tp)

$result = [ordered]@{
  measured_at = (Get-Date).ToString("s")
  input_csv = (Resolve-Path $InputCsv).Path
  total = $total
  confusion_matrix = [ordered]@{
    TP = $tp
    TN = $tn
    FP = $fp
    FN = $fn
  }
  metrics = [ordered]@{
    accuracy = $accuracy
    precision = $precision
    recall = $recall
    f1 = $f1
    false_positive_rate = $falsePositiveRate
    false_negative_rate = $falseNegativeRate
  }
}

$json = $result | ConvertTo-Json -Depth 6
Set-Content -Path $OutJson -Value $json -Encoding UTF8
Write-Output $json
