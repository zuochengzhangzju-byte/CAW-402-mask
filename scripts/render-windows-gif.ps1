param(
  [string]$Output = "assets/videos/caw-402-mask-demo.gif"
)

Add-Type -AssemblyName System.Drawing

$width = 1280
$height = 720
$bg = [System.Drawing.Color]::FromArgb(10, 14, 24)
$panel = [System.Drawing.Color]::FromArgb(17, 24, 39)
$green = [System.Drawing.Color]::FromArgb(25, 229, 140)
$white = [System.Drawing.Color]::FromArgb(248, 250, 252)
$muted = [System.Drawing.Color]::FromArgb(154, 167, 178)
$amber = [System.Drawing.Color]::FromArgb(251, 191, 36)
$cyan = [System.Drawing.Color]::FromArgb(125, 211, 252)

$font = New-Object System.Drawing.Font "Consolas", 20, ([System.Drawing.FontStyle]::Regular)
$bold = New-Object System.Drawing.Font "Consolas", 20, ([System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font "Consolas", 16, ([System.Drawing.FontStyle]::Regular)
$title = New-Object System.Drawing.Font "Segoe UI", 24, ([System.Drawing.FontStyle]::Bold)

$brushes = @{
  bg = New-Object System.Drawing.SolidBrush $bg
  panel = New-Object System.Drawing.SolidBrush $panel
  green = New-Object System.Drawing.SolidBrush $green
  white = New-Object System.Drawing.SolidBrush $white
  muted = New-Object System.Drawing.SolidBrush $muted
  amber = New-Object System.Drawing.SolidBrush $amber
  cyan = New-Object System.Drawing.SolidBrush $cyan
}

$script:lines = @()
$frames = New-Object System.Collections.Generic.List[System.Drawing.Bitmap]

function Add-Lines([string[]]$newLines) {
  foreach ($line in $newLines) {
    $script:lines += $line
  }
}

function Pick-Brush([string]$line) {
  if ($line.StartsWith("agent$")) { return $brushes.green }
  if ($line -match "PUBLIC_RETURN_LINK|SIMULATED|warning|requiredAckFlag") { return $brushes.amber }
  if ($line -match "priceUsdc|network|resource|rail|MAX_USD|MONTHLY|PRIVATE_KEY|PX402") { return $brushes.cyan }
  if ($line.StartsWith("+") -or $line.StartsWith("|")) { return $brushes.green }
  if ($line -match "Result:|Small CAW-authorized") { return $brushes.white }
  return $brushes.muted
}

function New-TerminalFrame([string]$caption) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear($bg)

  $g.FillRectangle($brushes.panel, 34, 34, 1212, 652)
  $g.FillEllipse($brushes.amber, 62, 58, 14, 14)
  $g.FillEllipse($brushes.green, 86, 58, 14, 14)
  $g.FillEllipse($brushes.cyan, 110, 58, 14, 14)
  $g.DrawString("CAW-402 Mask - agent payment privacy adapter", $title, $brushes.white, 150, 48)
  $g.DrawString($caption, $small, $brushes.muted, 150, 84)

  $visibleCount = 23
  $start = [Math]::Max(0, $script:lines.Count - $visibleCount)
  $visible = $script:lines[$start..($script:lines.Count - 1)]
  $y = 126
  foreach ($line in $visible) {
    $drawLine = $line
    if ($drawLine.Length -gt 104) {
      $drawLine = $drawLine.Substring(0, 101) + "..."
    }
    $useFont = if ($line.StartsWith("agent$") -or $line -match "Small CAW-authorized") { $bold } else { $font }
    $g.DrawString($drawLine, $useFont, (Pick-Brush $line), 66, $y)
    $y += 24
  }

  $g.Dispose()
  return $bmp
}

function Add-Frame([string]$caption, [string[]]$newLines, [int]$repeat = 1) {
  Add-Lines $newLines
  for ($i = 0; $i -lt $repeat; $i++) {
    $frames.Add((New-TerminalFrame $caption))
  }
}

Add-Frame "Production principle" @(
  "+------------------------------------------------------------------------------------------+",
  "| CAW-402 MASK: PRODUCTION PRINCIPLE                                                       |",
  "| Small CAW-authorized budgets are working capital for agent purchases.                    |",
  "| Spend privately on allowed x402 services, or hold residual funds in the note.            |",
  "+------------------------------------------------------------------------------------------+",
  "SIMULATED PRODUCT VIDEO: no real key, no signing, no payment broadcast."
) 5

Add-Frame "Required local configuration" @(
  "",
  "agent$ cat .env.agent.example",
  "PRIVATE_KEY=0x...low_value_disposable_base_wallet",
  "X402_CHAIN=base",
  "BASE_RPC_URL=https://mainnet.base.org",
  "MAX_USD_PER_CALL=0.06",
  "MONTHLY_BUDGET_USD=20",
  "PX402_NOTE_SECRET_FILE=./data/secrets/px402-note-password.json"
) 4

Add-Frame "Local note secret vault" @(
  "",
  "agent$ npm run privacy -- secrets:init",
  "{",
  '  "action": "secrets_init",',
  '  "notePasswordSource": "local_secret_vault",',
  '  "noteSecretPath": "./data/secrets/px402-note-password.json",',
  '  "passwordPrinted": false',
  "}"
) 4

Add-Frame "Budget and policy check" @(
  "",
  "agent$ npm run privacy -- doctor",
  "{",
  '  "wallet": "0x...disposable",',
  '  "maxUsdPerCall": 0.06,',
  '  "monthlyBudgetUsd": 20,',
  '  "monthlySpentUsd": 0,',
  '  "latestNoteBalanceUsdc": 0',
  "}"
) 4

Add-Frame "x402 paid service quote" @(
  "",
  "agent$ npm run demo:nansen -- --dataset netflow --dry-run",
  "{",
  '  "provider": "nansen_netflow",',
  '  "priceUsdc": 0.05,',
  '  "network": "eip155:8453",',
  '  "resource": "https://api.nansen.ai/api/v1/smart-money/netflow",',
  '  "rail": "px402_private_note -> disposable payer -> x402"',
  "}"
) 5

Add-Frame "Privacy warning before treasury return" @(
  "",
  "agent$ npm run privacy -- return:caw",
  "{",
  '  "warning": "PUBLIC_RETURN_LINK",',
  '  "message": "Returning funds to CAW is reconciliation, not the privacy default.",',
  '  "requiredAckFlag": "--ack-return-link"',
  "}",
  "",
  "Result: one local CLI gives the agent governed budget, paid x402 access,",
  "receipt/audit trails, and explicit privacy warnings before treasury return."
) 8

function New-PropertyItem([int]$id, [int]$type, [byte[]]$value) {
  $item = [System.Runtime.Serialization.FormatterServices]::GetUninitializedObject([System.Drawing.Imaging.PropertyItem])
  $item.Id = $id
  $item.Type = $type
  $item.Len = $value.Length
  $item.Value = $value
  return $item
}

$delayCs = 90
$delayBytes = New-Object byte[] (4 * $frames.Count)
for ($i = 0; $i -lt $frames.Count; $i++) {
  [Array]::Copy([BitConverter]::GetBytes([int]$delayCs), 0, $delayBytes, 4 * $i, 4)
}
$frames[0].SetPropertyItem((New-PropertyItem 0x5100 4 $delayBytes))
$frames[0].SetPropertyItem((New-PropertyItem 0x5101 3 ([byte[]](0, 0))))

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Output) | Out-Null
if (Test-Path $Output) {
  Remove-Item -LiteralPath $Output -Force
}

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/gif" }
$saveFlag = [System.Drawing.Imaging.Encoder]::SaveFlag
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $saveFlag, ([long][System.Drawing.Imaging.EncoderValue]::MultiFrame)
$frames[0].Save($Output, $encoder, $params)

$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $saveFlag, ([long][System.Drawing.Imaging.EncoderValue]::FrameDimensionTime)
for ($i = 1; $i -lt $frames.Count; $i++) {
  $frames[0].SaveAdd($frames[$i], $params)
}

$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $saveFlag, ([long][System.Drawing.Imaging.EncoderValue]::Flush)
$frames[0].SaveAdd($params)

foreach ($frame in $frames) {
  $frame.Dispose()
}
foreach ($brush in $brushes.Values) {
  $brush.Dispose()
}
$font.Dispose()
$bold.Dispose()
$small.Dispose()
$title.Dispose()

Get-Item -LiteralPath $Output | Select-Object FullName, Length
