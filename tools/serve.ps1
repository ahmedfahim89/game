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
#
# -Root dist serves the output of tools/build.ps1 instead, and is the reference
# for what a real host must send: a 7-day immutable cache on content-hashed
# files, and no-cache on everything else so index.html always names the latest.

param([int]$Port = 8080, [string]$Root = '')

$ErrorActionPreference = 'Stop'
$root = if ($Root) { (Resolve-Path -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) $Root)).Path } else { Split-Path -Parent $PSScriptRoot }

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

    # One failed request (a client hanging up mid-response, say) must not take
    # the whole server down with it.
    try {
      if ($inside -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $extension = [System.IO.Path]::GetExtension($full).ToLower()
        $context.Response.ContentType = if ($types.ContainsKey($extension)) { $types[$extension] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $context.Response.ContentLength64 = $bytes.Length

        # Only a name that carries its own content hash can be cached for a week:
        # an unhashed file would keep serving the old copy after an edit.
        $cache = if ($full -match '\.[0-9a-f]{8}\.(js|css)$') { 'public, max-age=604800, immutable' } else { 'no-cache' }
        $context.Response.Headers.Add('Cache-Control', $cache)

        # HttpListener sends no body for HEAD and throws if one is written.
        # Preview tools probe readiness with HEAD, so this path is hit first.
        if ($context.Request.HttpMethod -ne 'HEAD') {
          $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      }
      else {
        $context.Response.StatusCode = 404
      }
    }
    catch {
      Write-Warning "$($context.Request.HttpMethod) $requested failed: $($_.Exception.Message)"
    }
    finally {
      $context.Response.Close()
    }
  }
}
finally {
  $listener.Stop()
}
