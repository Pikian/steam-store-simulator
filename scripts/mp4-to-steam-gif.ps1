# Convert MP4 exports to Steam-friendly animated GIFs (single file per video).
# Usage: .\scripts\mp4-to-steam-gif.ps1 -InputDir "C:\path\to\videos"

param(
    [string]$InputDir = "C:\Users\sebas\Videos\GNOME Trailer\GIFs\Export Premiere",
    [string]$OutputDir = "",
    [int]$MaxWidth = 1280,
    [int]$Fps = 10,
    [int]$MaxColors = 128,
    [string]$FfmpegPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $OutputDir) {
    $OutputDir = Join-Path $InputDir "steam-gifs"
}

if (-not $FfmpegPath) {
    $repoFfmpeg = Join-Path $PSScriptRoot "..\tools\ffmpeg\extracted\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe"
    $repoFfmpeg = (Resolve-Path $repoFfmpeg -ErrorAction SilentlyContinue).Path
    if ($repoFfmpeg -and (Test-Path $repoFfmpeg)) {
        $FfmpegPath = $repoFfmpeg
    } else {
        $FfmpegPath = "ffmpeg"
    }
}

if (-not (Test-Path $FfmpegPath) -and $FfmpegPath -eq "ffmpeg") {
    throw "ffmpeg not found. Install FFmpeg or run from repo after tools/ffmpeg is set up."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$videos = Get-ChildItem -Path $InputDir -File | Where-Object {
    $_.Extension -match '^\.(mp4|webm|mov)$'
}

if ($videos.Count -eq 0) {
    Write-Host "No video files found in: $InputDir"
    exit 0
}

Write-Host "Input:  $InputDir"
Write-Host "Output: $OutputDir"
Write-Host "Max width: ${MaxWidth}px (no upscale) @ ${Fps}fps, ${MaxColors} colors"
Write-Host ""

foreach ($video in $videos) {
    $outName = [System.IO.Path]::GetFileNameWithoutExtension($video.Name) + ".gif"
    $outPath = Join-Path $OutputDir $outName

    Write-Host "Converting: $($video.Name) -> $outName"

    $vf = "fps=$Fps,scale='min($MaxWidth,iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${MaxColors}:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3"

    & $FfmpegPath -y -i $video.FullName -vf $vf -loop 0 $outPath 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed: $($video.Name)"
        continue
    }

    $sizeMb = [math]::Round((Get-Item $outPath).Length / 1MB, 2)
    Write-Host "  Done: $sizeMb MB -> $outPath"
}

Write-Host ""
Write-Host "Finished. GIFs are in: $OutputDir"
