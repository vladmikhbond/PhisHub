$projects = @(
    "Waves2d"
   
)

foreach ($project in $projects) {
    Write-Host "`n=== Обробка $project ===" -ForegroundColor Cyan

    & "$PSScriptRoot\deploy.ps1" $project

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Помилка під час обробки $project"
    }
}