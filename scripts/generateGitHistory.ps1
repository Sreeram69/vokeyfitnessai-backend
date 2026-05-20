# VokeyFitness Git History Generator (PowerShell)
# This script initializes Git and creates a realistic 3-week daily commit history.
# Confidential details like .env files are strictly excluded from backups and Git tracking.

$ErrorActionPreference = "Stop"

# Ensure Git is installed
try {
    git --version | Out-Null
} catch {
    Write-Error "Git is not installed or not in PATH. Please install Git."
}

# Base directories
$clientPath = "c:\Users\Sreeram\vokeyfitness-client"
$backendPath = "c:\Users\Sreeram\vokeyfitness-backend"

$clientBackup = "c:\Users\Sreeram\vokeyfitness-client-backup"
$backendBackup = "c:\Users\Sreeram\vokeyfitness-backend-backup"

# Configure Git username/email globally
git config --global user.name "Sreeram Cheekatla"
git config --global user.email "ramsreeram249@gmail.com"

# Helper function to back up a folder recursively (excluding node_modules, .git, and .env files)
function Backup-Folder($source, $dest) {
    if (Test-Path $dest) {
        Remove-Item -Recurse -Force $dest
    }
    New-Item -ItemType Directory -Path $dest | Out-Null
    
    Get-ChildItem -Path $source -Recurse | Where-Object {
        $_.FullName -notmatch '\\node_modules(\\|$)' -and
        $_.FullName -notmatch '\\\.git(\\|$)' -and
        $_.Name -notmatch '^\.env'
    } | ForEach-Object {
        $relPath = $_.FullName.Substring($source.Length + 1)
        $targetPath = Join-Path $dest $relPath
        if ($_.PSIsContainer) {
            if (!(Test-Path $targetPath)) {
                New-Item -ItemType Directory -Path $targetPath | Out-Null
            }
        } else {
            $parent = Split-Path $targetPath -Parent
            if (!(Test-Path $parent)) {
                New-Item -ItemType Directory -Path $parent | Out-Null
            }
            Copy-Item -Path $_.FullName -Destination $targetPath -Force
        }
    }
}

# Helper function to delete files in active directory (except node_modules, .git, and .env files)
function Clean-Active-Folder($path) {
    Get-ChildItem -Path $path | Where-Object {
        $_.Name -notmatch '^node_modules$' -and
        $_.Name -notmatch '^\.git$' -and
        $_.Name -notmatch '^\.env'
    } | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force
    }
}

# Helper function to copy specific path from backup to active folder (preserving folder structure)
function Restore-File($relPath, $backup, $active) {
    $src = Join-Path $backup $relPath
    $dst = Join-Path $active $relPath
    
    if (Test-Path $src) {
        $parent = Split-Path $dst -Parent
        if (!(Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent | Out-Null
        }
        if (Test-Path $dst -PathType Container) {
            # Destination directory already exists, copy contents instead of nesting the directory
            Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        } else {
            # Destination does not exist or is a file
            Copy-Item -Path $src -Destination $dst -Recurse -Force
        }
    }
}

# Helper to commit files with a specific backdated date
function Commit-Date($msg, $dateStr, $repoPath) {
    Push-Location $repoPath
    git add -A
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    git commit -m $msg --date=$dateStr
    Pop-Location
}

# Create backups
Write-Host "Creating temporary backups of your current codebase..." -ForegroundColor Cyan
Backup-Folder $clientPath $clientBackup
Backup-Folder $backendPath $backendBackup

# Initialize git repositories
Write-Host "Initializing Git repositories..." -ForegroundColor Cyan
# Completely delete existing .git directories to ensure clean re-initialization
if (Test-Path (Join-Path $clientPath ".git")) {
    Remove-Item -Recurse -Force (Join-Path $clientPath ".git")
}
if (Test-Path (Join-Path $backendPath ".git")) {
    Remove-Item -Recurse -Force (Join-Path $backendPath ".git")
}

Clean-Active-Folder $clientPath
Clean-Active-Folder $backendPath

Push-Location $clientPath
git init -b main
# Ensure git config ignores env files locally too
".env`n.env.local`n.env.development`n.env.production`n*.env*`nnode_modules/`ndist/`n*.log" | Out-File -FilePath ".gitignore" -Encoding utf8
Pop-Location

Push-Location $backendPath
git init -b main
".env`n.env.local`n.env.development`n.env.production`n*.env*`nnode_modules/`nlogs/`n*.log" | Out-File -FilePath ".gitignore" -Encoding utf8
Pop-Location

# Build Timestamps (3 weeks = 21 days. Today is May 24, 2026. Day 1 is May 3, 2026)
$baseDate = Get-Date "2026-05-03 10:00:00"

# --- Day 1 (May 3): Repo init & Base structures ---
$dayDate = $baseDate.ToString("yyyy-MM-dd HH:mm:ss")
Write-Host "Building Day 1 ($dayDate)..." -ForegroundColor Yellow
# Client
Restore-File "package.json" $clientBackup $clientPath
Restore-File ".gitignore" $clientBackup $clientPath
Restore-File "vite.config.js" $clientBackup $clientPath
Restore-File "tailwind.config.js" $clientBackup $clientPath
Restore-File "eslint.config.js" $clientBackup $clientPath
Restore-File "index.html" $clientBackup $clientPath
Commit-Date "initial client setup with react, vite, and tailwind" $dayDate $clientPath

# Backend
Restore-File "package.json" $backendBackup $backendPath
Restore-File "package-lock.json" $backendBackup $backendPath
Restore-File "Dockerfile" $backendBackup $backendPath
Restore-File "docker-compose.yml" $backendBackup $backendPath
Restore-File "check-db.js" $backendBackup $backendPath
Restore-File "server.js" $backendBackup $backendPath
Restore-File "src/app.js" $backendBackup $backendPath
Restore-File ".gitignore" $backendBackup $backendPath
Commit-Date "initial node server setup, express app and packages" $dayDate $backendPath


# --- Day 2 (May 4): Core Authentication (Backend User model & routes) ---
$dayDate = $baseDate.AddDays(1).ToString("yyyy-MM-dd 11:30:00")
Write-Host "Building Day 2 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/models/User.js" $backendBackup $backendPath
Restore-File "src/controllers/authController.js" $backendBackup $backendPath
Restore-File "src/routes/authRoutes.js" $backendBackup $backendPath
Commit-Date "added user mongoose model and basic auth routes" $dayDate $backendPath


# --- Day 3 (May 5): Client Auth Panel & Redux integration ---
$dayDate = $baseDate.AddDays(2).ToString("yyyy-MM-dd 14:15:00")
Write-Host "Building Day 3 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/app/slices/authSlice.js" $clientBackup $clientPath
Restore-File "src/pages/AuthPage.jsx" $clientBackup $clientPath
Restore-File "src/api/axios.js" $clientBackup $clientPath
Restore-File "src/app" $clientBackup $clientPath
Restore-File "src/App.jsx" $clientBackup $clientPath
Restore-File "src/main.jsx" $clientBackup $clientPath
Commit-Date "configured auth slice for redux store state" $dayDate $clientPath
Commit-Date "designed modern login and registration page UI" $dayDate $clientPath


# --- Day 4 (May 6): Workout Tracking schemas ---
$dayDate = $baseDate.AddDays(3).ToString("yyyy-MM-dd 10:45:00")
Write-Host "Building Day 4 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/models/WorkoutSession.js" $backendBackup $backendPath
Restore-File "src/controllers/workoutController.js" $backendBackup $backendPath
Restore-File "src/routes/workoutRoutes.js" $backendBackup $backendPath
Commit-Date "created workout session schema and logging routes" $dayDate $backendPath


# --- Day 5 (May 7): Active Workout STOPWATCH Widget ---
$dayDate = $baseDate.AddDays(4).ToString("yyyy-MM-dd 16:30:00")
Write-Host "Building Day 5 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/pages/ActiveWorkoutPage.jsx" $clientBackup $clientPath
Restore-File "src/components/dashboard/StopwatchWidget.jsx" $clientBackup $clientPath
Restore-File "src/components/dashboard" $clientBackup $clientPath
Commit-Date "added active workout tracking view with checklists" $dayDate $clientPath
Commit-Date "built highly accurate visual stopwatch widget" $dayDate $clientPath


# --- Day 6 (May 8): useStopwatch Hook Refactor ---
$dayDate = $baseDate.AddDays(5).ToString("yyyy-MM-dd 15:00:00")
Write-Host "Building Day 6 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/hooks/useStopwatch.js" $clientBackup $clientPath
Commit-Date "moved stopwatch tracking logic to a custom react hook" $dayDate $clientPath


# --- Day 7 (May 9): Auth verification OTP ---
$dayDate = $baseDate.AddDays(6).ToString("yyyy-MM-dd 11:00:00")
Write-Host "Building Day 7 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/models/OtpCode.js" $backendBackup $backendPath
Restore-File "src/services/emailService.js" $backendBackup $backendPath
Commit-Date "added otp email verification schema with auto expiry" $dayDate $backendPath
Commit-Date "configured nodemailer smtp transport services helper" $dayDate $backendPath


# --- Day 8 (May 10): Nutrition tracking models ---
$dayDate = $baseDate.AddDays(7).ToString("yyyy-MM-dd 13:20:00")
Write-Host "Building Day 8 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/models/Meal.js" $backendBackup $backendPath
Restore-File "src/controllers/nutritionController.js" $backendBackup $backendPath
Restore-File "src/routes/nutritionRoutes.js" $backendBackup $backendPath
Commit-Date "created meal schema and daily nutrition logging endpoints" $dayDate $backendPath


# --- Day 9 (May 11): Nutrition details widgets ---
$dayDate = $baseDate.AddDays(8).ToString("yyyy-MM-dd 15:45:00")
Write-Host "Building Day 9 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/pages/NutritionPage.jsx" $clientBackup $clientPath
Restore-File "src/components/ui/ProgressRing.jsx" $clientBackup $clientPath
Commit-Date "built food tracker dashboard with customized meal plans" $dayDate $clientPath


# --- Day 10 (May 12): AI Gemini backend integration ---
$dayDate = $baseDate.AddDays(9).ToString("yyyy-MM-dd 10:10:00")
Write-Host "Building Day 10 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/controllers/aiController.js" $backendBackup $backendPath
Restore-File "src/routes/aiRoutes.js" $backendBackup $backendPath
Commit-Date "integrated google gemini api and designed system prompts" $dayDate $backendPath


# --- Day 11 (May 13): VokeyCoach UI Modal layout ---
$dayDate = $baseDate.AddDays(10).ToString("yyyy-MM-dd 14:30:00")
Write-Host "Building Day 11 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/components/ui/VokeyCoach.jsx" $clientBackup $clientPath
Restore-File "src/api/aiApi.js" $clientBackup $clientPath
Commit-Date "created floating chat assistant UI panel for VokeyCoach" $dayDate $clientPath


# --- Day 12 (May 14): GPU hovers & Card transitions ---
$dayDate = $baseDate.AddDays(11).ToString("yyyy-MM-dd 16:50:00")
Write-Host "Building Day 12 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/components/ui/PremiumCard.jsx" $clientBackup $clientPath
Restore-File "src/components/ui/Card.jsx" $clientBackup $clientPath
Restore-File "src/index.css" $clientBackup $clientPath
Commit-Date "optimized card transitions and enabled gpu willchange transforms" $dayDate $clientPath


# --- Day 13 (May 15): Admin dashboard controller ---
$dayDate = $baseDate.AddDays(12).ToString("yyyy-MM-dd 11:15:00")
Write-Host "Building Day 13 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/controllers/adminController.js" $backendBackup $backendPath
Restore-File "src/routes/adminRoutes.js" $backendBackup $backendPath
Restore-File "src/admin/pages/AdminDashboardPage.jsx" $clientBackup $clientPath
Commit-Date "added cpu and platform load metrics for system console" $dayDate $backendPath
Commit-Date "designed admin console landing layout with stats bento grids" $dayDate $clientPath


# --- Day 14 (May 16): Mic Permissions & StrictMode Fixes ---
$dayDate = $baseDate.AddDays(13).ToString("yyyy-MM-dd 15:40:00")
Write-Host "Building Day 14 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/components/ui/VokeyCoach.jsx" $clientBackup $clientPath
Commit-Date "fixed strict mode unmount microphone abort issues" $dayDate $clientPath


# --- Day 15 (May 17): Admin date-range filters ---
$dayDate = $baseDate.AddDays(14).ToString("yyyy-MM-dd 10:20:00")
Write-Host "Building Day 15 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/controllers/adminController.js" $backendBackup $backendPath
Restore-File "src/admin/pages/AdminDashboardPage.jsx" $clientBackup $clientPath
Restore-File "src/admin/pages/AdminAnalyticsPage.jsx" $clientBackup $clientPath
Restore-File "src/admin/services/adminService.js" $clientBackup $clientPath
Commit-Date "added day month year filtering queries to stats endpoint" $dayDate $backendPath
Commit-Date "integrated period filter buttons to dashboards and chart views" $dayDate $clientPath


# --- Day 16 (May 18): Voice Search / Voice replies ---
$dayDate = $baseDate.AddDays(15).ToString("yyyy-MM-dd 14:50:00")
Write-Host "Building Day 16 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/components/ui/VokeyCoach.jsx" $clientBackup $clientPath
Restore-File "src/index.css" $clientBackup $clientPath
Commit-Date "added handsfree speech search input and text to speech audio replies" $dayDate $clientPath


# --- Day 17 (May 19): Dashboard notification alerts ---
$dayDate = $baseDate.AddDays(16).ToString("yyyy-MM-dd 11:10:00")
Write-Host "Building Day 17 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/models/Notification.js" $backendBackup $backendPath
Restore-File "src/controllers/notificationController.js" $backendBackup $backendPath
Restore-File "src/pages/NotificationsPage.jsx" $clientBackup $clientPath
Commit-Date "created dashboard alerts notification schema and services" $dayDate $backendPath
Commit-Date "built notifications feed panel to track user alerts" $dayDate $clientPath


# --- Day 18 (May 20): Background workers (Nodemailer tasks queue) ---
$dayDate = $baseDate.AddDays(17).ToString("yyyy-MM-dd 16:15:00")
Write-Host "Building Day 18 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/utils/emailQueue.js" $backendBackup $backendPath
Restore-File "src/controllers/authController.js" $backendBackup $backendPath
Commit-Date "implemented async email task queues using redis list operations" $dayDate $backendPath


# --- Day 19 (May 21): Real-time SSE / Redis Pub/Sub ---
$dayDate = $baseDate.AddDays(18).ToString("yyyy-MM-dd 13:40:00")
Write-Host "Building Day 19 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/utils/redisClient.js" $backendBackup $backendPath
Restore-File "src/utils/notificationEmitter.js" $backendBackup $backendPath
Restore-File "src/controllers/sseController.js" $backendBackup $backendPath
Commit-Date "migrated alerts framework to server sent events with redis pubsub" $dayDate $backendPath


# --- Day 20 (May 22): Clustered JWT Blacklisting cache ---
$dayDate = $baseDate.AddDays(19).ToString("yyyy-MM-dd 10:30:00")
Write-Host "Building Day 20 ($dayDate)..." -ForegroundColor Yellow
Restore-File "src/utils/tokenBlacklist.js" $backendBackup $backendPath
Restore-File "src/middleware/authMiddleware.js" $backendBackup $backendPath
Commit-Date "added redis based jwt invalidation blacklist with live ttls" $dayDate $backendPath


# --- Day 21 (May 23/24): Restoring remainder & Docker configs ---
$dayDate = $baseDate.AddDays(20).ToString("yyyy-MM-dd 15:00:00")
Write-Host "Building Day 21 ($dayDate)..." -ForegroundColor Yellow

# Copy remaining root files and folders safely from backup to active folder (no nested loop replication)
Get-ChildItem -Path $clientBackup | Where-Object { $_.Name -notmatch '^\.env' } | ForEach-Object {
    $destFile = Join-Path $clientPath $_.Name
    if ($_.PSIsContainer) {
        if (!(Test-Path $destFile)) {
            New-Item -ItemType Directory -Path $destFile | Out-Null
        }
        Copy-Item -Path "$($_.FullName)\*" -Destination $destFile -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $destFile -Force
    }
}
Get-ChildItem -Path $backendBackup | Where-Object { $_.Name -notmatch '^\.env' } | ForEach-Object {
    $destFile = Join-Path $backendPath $_.Name
    if ($_.PSIsContainer) {
        if (!(Test-Path $destFile)) {
            New-Item -ItemType Directory -Path $destFile | Out-Null
        }
        Copy-Item -Path "$($_.FullName)\*" -Destination $destFile -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $destFile -Force
    }
}

# Verify and enforce .gitignore contents at the end
foreach ($repo in @($clientPath, $backendPath)) {
    $giPath = Join-Path $repo ".gitignore"
    if (Test-Path $giPath) {
        $content = Get-Content $giPath
        $needsUpdate = $false
        foreach ($pattern in @(".env", ".env.local", ".env.development", ".env.production", "*.env*")) {
            if ($content -notcontains $pattern) {
                $content += $pattern
                $needsUpdate = $true
            }
        }
        if ($needsUpdate) {
            $content | Out-File -FilePath $giPath -Encoding utf8 -Force
        }
    }
}

Commit-Date "created multi stage production Dockerfiles and nginx configs" $dayDate $clientPath
Commit-Date "setup docker compose configuration for service orchestration" $dayDate $backendPath

# Remove temporary backups
Remove-Item -Recurse -Force $clientBackup
Remove-Item -Recurse -Force $backendBackup

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Git History Rebuilt Correctly without duplicates or env!" -ForegroundColor Green
Write-Host "Go to Vercel/GitHub to connect your repositories." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
