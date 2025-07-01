# PowerShell script to convert PNG to ICO
# This script uses .NET System.Drawing to convert PNG to ICO format

Add-Type -AssemblyName System.Drawing

$inputPath = "assets\icon.png"
$outputPath = "assets\icon.ico"

if (Test-Path $inputPath) {
    try {
        # Load the PNG image
        $image = [System.Drawing.Image]::FromFile((Resolve-Path $inputPath).Path)
        
        # Create a new bitmap with 256x256 size (standard ICO size)
        $bitmap = New-Object System.Drawing.Bitmap(256, 256)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, 0, 0, 256, 256)
        
        # Save as ICO
        $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Icon)
        
        Write-Host "Successfully converted PNG to ICO: $outputPath" -ForegroundColor Green
        
        # Cleanup
        $graphics.Dispose()
        $bitmap.Dispose()
        $image.Dispose()
        
    } catch {
        Write-Host "Error converting PNG to ICO: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You can use online converters instead:" -ForegroundColor Yellow
        Write-Host "- https://convertio.co/png-ico/" -ForegroundColor Yellow
        Write-Host "- https://icoconvert.com/" -ForegroundColor Yellow
    }
} else {
    Write-Host "Input file not found: $inputPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "To build the installer with icon, run:" -ForegroundColor Cyan
Write-Host "npm run build-installer" -ForegroundColor Green 