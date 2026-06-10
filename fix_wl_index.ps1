$appPath = "app.js"
$content = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# Remove the orderBy that breaks the index requirement
$oldStr = ".where('period', '==', period)`r`n    .orderBy('createdAt', 'desc').onSnapshot"
$newStr = ".where('period', '==', period).onSnapshot"

$content = $content -replace [regex]::Escape($oldStr), $newStr

[System.IO.File]::WriteAllText($appPath, $content, [System.Text.Encoding]::UTF8)
Write-Output "Done"
