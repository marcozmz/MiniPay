# Original monogram using the existing brand colors. Full opaque background and
# central glyphs keep the 512px icon inside the maskable circular safe area.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../public/icons'
foreach ($icon in @(@{ Size=192; Name='icon-192.png' }, @{ Size=512; Name='icon-512.png' }, @{ Size=180; Name='apple-touch-icon.png' })) {
    $bitmap = New-Object System.Drawing.Bitmap($icon.Size, $icon.Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $font = New-Object System.Drawing.Font('Segoe UI', ($icon.Size * 0.43), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    try {
        $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#204e40'))
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $bounds = New-Object System.Drawing.RectangleF(0, (-0.025 * $icon.Size), $icon.Size, $icon.Size)
        $graphics.DrawString('m.', $font, [System.Drawing.Brushes]::White, $bounds, $format)
        $bitmap.Save((Join-Path $iconDirectory $icon.Name), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $format.Dispose(); $font.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
}
