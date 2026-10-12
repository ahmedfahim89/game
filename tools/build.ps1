# Deploy build: copies the game to dist/ with a content hash in every JS and CSS
# filename, and rewrites index.html to match.
#
# The game itself needs none of this. index.html in the project root still plays
# from the filesystem with plain filenames. This exists so a host can send
# "Cache-Control: max-age=604800, immutable" (7 days) for the hashed files: a
# changed file gets a new name, so no visitor is ever stuck on a stale copy, and
# index.html itself is served with no-cache so it always points at the latest.
#
#   powershell -ExecutionPolicy Bypass -File tools/build.ps1
#
# Then upload dist/ and configure the host (see tools/serve.ps1 -Root dist for
# the exact headers). Images are copied unchanged and are not hashed.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'

if (Test-Path -LiteralPath $dist) { Remove-Item -LiteralPath $dist -Recurse -Force }
New-Item -ItemType Directory -Path $dist | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)
$html = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'), $utf8)

# Every local script and stylesheet index.html loads. Neither the CSS nor the JS
# refers to another hashed file, so one pass is enough: no hash depends on another.
$pattern = '(?:src|href)="([^"]+\.(?:js|css))"'
$refs = [regex]::Matches($html, $pattern) | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

foreach ($ref in $refs) {
  if ($ref -match '^(https?:)?//') { throw "$ref is remote. The game must not load from the network." }

  $source = Join-Path $root ($ref -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "index.html references $ref, which does not exist." }

  $hash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.Substring(0, 8).ToLower()
  $hashed = $ref -replace '\.(js|css)$', ".$hash.`$1"

  $target = Join-Path $dist ($hashed -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target

  $html = $html.Replace("`"$ref`"", "`"$hashed`"")
  Write-Host "  $ref -> $hashed"
}

[System.IO.File]::WriteAllText((Join-Path $dist 'index.html'), $html, $utf8)
Copy-Item -LiteralPath (Join-Path $root 'assets\image') -Destination (Join-Path $dist 'assets\image') -Recurse

Write-Host "Built $($refs.Count) hashed files into $dist"
