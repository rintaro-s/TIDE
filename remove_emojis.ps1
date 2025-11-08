# Remove emojis from main.ts
$file = "e:\github\TIDE\src\main\main.ts"
$content = Get-Content $file -Raw

# Remove common emoji patterns
$patterns = @(
    '🚀', '✅', '❌', '📥', '🔎', '👋', '🔄', 'ℹ️', '🪟', '🔗', '📄', '🎨', '💥', '✨', '📋',
    '🔌', '📖', '💾', '🔍', '✍️', '📝', '📏', '⚠️', '🌐', '⚙️', '🧹', '🎵', '🔧', '📥'
)

foreach ($emoji in $patterns) {
    $content = $content -replace [regex]::Escape($emoji), ''
}

# Clean up extra spaces
$content = $content -replace "log\('\s+'", "log('"
$content = $content -replace ", ''\)", ")"

Set-Content $file $content -Encoding UTF8

Write-Host "Removed emojis from $file"
