$source = "C:\Git\PHISICS\Carno2d\dist"
$destination = "C:\Git\PHISICS\PhisHub\app\static\carno2d"

# Створити цільову папку, якщо вона не існує
if (!(Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
}

# Скопіювати файли та оновити наявні
Copy-Item -Path "$source\*.html", "$source\*.css", "$source\*.js" `
          -Destination $destination -Force

Write-Host "Копіювання завершено." -ForegroundColor Green