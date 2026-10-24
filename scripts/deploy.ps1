param(
    [Parameter(Mandatory = $true)]
    [string]$Project
)

$source = "C:\Git\PHISICS\$Project\dist"
$destination = "C:\Git\PHISICS\PhisHub\app\static\$Project"

# Перевірити існування вихідної папки
if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    Write-Error "Вихідну папку не знайдено: $source"
    exit 1
}

# Створити цільову папку, якщо вона не існує
New-Item -ItemType Directory -Path $destination -Force | Out-Null

# Копіювати HTML, CSS та JS файли з оновленням існуючих
Copy-Item -Path "$source\*.html", "$source\*.css", "$source\*.js" `
    -Destination $destination -Force

Write-Host "Копіювання файлів проєкту $Project завершено."