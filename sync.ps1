# PowerShell script to sync local changes to GitHub and deploy to Vercel
# Usage: Run this script in your project directory

$commitMessage = Read-Host 'Enter commit message (or press Enter for default)'
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Auto-sync: update from local $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

Write-Host "Pushing changes to GitHub..."
git add .
git commit -m "$commitMessage"
git push origin main

Write-Host "\nStarting direct deployment to Vercel for production..."
vercel --prod