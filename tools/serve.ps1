# Local static server, for development only.
#
# The game does not need this — index.html plays from the filesystem by
# double-clicking, which is the whole reason content ships as a <script> file
# instead of JSON. This exists because some browser previews refuse to run
# scripts from a file:// URL, and because tools/checks.html is easier to work
# with over http.
#
#   powershell -ExecutionPolicy Bypass -File tools/serve.ps1
#
# Ctrl+C to stop. Use -Port to move it if 8080 is taken.

param([int]$Port = 8080)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Underwater: serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requested = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
    if ($requested -eq '/') { $requested = '/index.html' }

    $relative = $requested.TrimStart('/') -replace '/', [System.IO.Path]::DirectorySeparatorChar
    $file = Join-Path $root $relative

    # Refuse anything that resolves outside the project root.
    $full = [System.IO.Path]::GetFullPath($file)
    $inside = $full.StartsWith([System.IO.Path]::GetFullPath($root), [System.StringComparison]::OrdinalIgnoreCase)

    if ($inside -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $extension = [System.IO.Path]::GetExtension($full).ToLower()
      $context.Response.ContentType = if ($types.ContainsKey($extension)) { $types[$extension] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $context.Response.StatusCode = 404
    }

    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
}
