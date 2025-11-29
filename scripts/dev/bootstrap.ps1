# WinMix TipsterHub Local Development Environment Bootstrap
# PowerShell script for Windows developers
# 
# Usage: .\scripts\dev\bootstrap.ps1
# 
# Prerequisites:
#   - Docker Desktop for Windows
#   - Node.js and npm
#   - PowerShell 5.0 or later (Windows 10+)

param(
    [switch]$SkipDocker = $false,
    [switch]$SkipDependencies = $false,
    [switch]$DryRun = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$ScriptDir = Join-Path $ProjectRoot "scripts" "dev"
$EnvFile = Join-Path $ProjectRoot ".env.local"
$DockerEnvFile = Join-Path $ProjectRoot "docker" ".env"
$DockerComposeFile = Join-Path $ProjectRoot "docker-compose.yml"
$SeedScript = Join-Path $ProjectRoot "scripts" "seed-database.mjs"
$HealthCheckScript = Join-Path $ProjectRoot "scripts" "dev" "healthcheck.ts"

# Colors
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Cyan

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Blue
}

function Test-CommandExists {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

function Check-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    if (-not (Test-CommandExists "docker")) {
        Write-Error-Custom "Docker is not installed. Please install Docker Desktop for Windows."
        exit 1
    }
    Write-Success "Docker installed"
    
    if (-not (Test-CommandExists "node")) {
        Write-Error-Custom "Node.js is not installed. Please install Node.js from https://nodejs.org"
        exit 1
    }
    Write-Success "Node.js installed"
    
    if (-not (Test-CommandExists "npm")) {
        Write-Error-Custom "npm is not installed. Please install Node.js with npm."
        exit 1
    }
    Write-Success "npm installed"
}

function Setup-EnvironmentFiles {
    Write-Info "Setting up environment files..."
    
    if (-not (Test-Path $EnvFile)) {
        $TemplateFile = "$ProjectRoot\.env.local.template"
        if (Test-Path $TemplateFile) {
            Copy-Item -Path $TemplateFile -Destination $EnvFile
            Write-Success "Created .env.local from template"
        }
        else {
            Write-Warning-Custom "No .env.local.template found, creating minimal .env.local"
            
            $EnvContent = @"
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PROJECT_ID=wclutzbojatqtxwlvtab
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTYzODQsImV4cCI6MjA3Nzc3MjM4NH0.GcFqrEtZhgEHq0ycfXPFwebBcUrOiO2LlOrLEWhkmnE
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTYzODQsImV4cCI6MjA3Nzc3MjM4NH0.GcFqrEtZhgEHq0ycfXPFwebBcUrOiO2LlOrLEWhkmnE
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NjM4NCwiZXhwIjoyMDc3NzcyMzg0fQ.5YhI1X7gCsQ6l4vIZvYrJ8T4cP1M9jN6K8L3Q2R5W0A
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
"@
            
            Set-Content -Path $EnvFile -Value $EnvContent
        }
    }
    else {
        Write-Success "Found existing .env.local"
    }
    
    if (-not (Test-Path $DockerEnvFile)) {
        $DockerExampleFile = "$ProjectRoot\docker\.env.example"
        if (Test-Path $DockerExampleFile) {
            Copy-Item -Path $DockerExampleFile -Destination $DockerEnvFile
            Write-Success "Created docker/.env from example"
        }
    }
}

function Install-Dependencies {
    Write-Info "Installing npm dependencies..."
    
    Push-Location $ProjectRoot
    try {
        npm install
        Write-Success "Dependencies installed"
    }
    finally {
        Pop-Location
    }
}

function Start-DockerServices {
    Write-Info "Starting Docker services..."
    
    Push-Location $ProjectRoot
    try {
        # Check if containers are already running
        $RunningContainers = docker-compose -f $DockerComposeFile ps 2>$null
        if ($null -ne $RunningContainers -and $RunningContainers -match "Up") {
            Write-Warning-Custom "Some containers are already running. Use 'docker-compose down' if needed."
        }
        
        if (-not $DryRun) {
            docker-compose -f $DockerComposeFile up -d
            Write-Success "Docker services started"
            
            Write-Info "Waiting for services to become healthy..."
            Start-Sleep -Seconds 10
        }
        else {
            Write-Info "[DRY RUN] Would start Docker services"
        }
    }
    finally {
        Pop-Location
    }
}

function Verify-Services {
    Write-Info "Verifying services..."
    
    # Basic TCP connectivity checks
    $Services = @(
        @{ Name = "Postgres"; Host = "localhost"; Port = 5432 },
        @{ Name = "Supabase REST"; Host = "localhost"; Port = 54321 }
    )
    
    foreach ($Service in $Services) {
        $Socket = New-Object System.Net.Sockets.TcpClient
        $Connect = $Socket.BeginConnect($Service.Host, $Service.Port, $null, $null)
        $Wait = $Connect.AsyncWaitHandle.WaitOne(5000, $false)
        
        if ($Socket.Connected) {
            Write-Success "$($Service.Name) is responding on $($Service.Host):$($Service.Port)"
        }
        else {
            Write-Error-Custom "$($Service.Name) is NOT responding on $($Service.Host):$($Service.Port)"
        }
        
        $Socket.Close()
    }
}

function Seed-Database {
    Write-Info "Seeding database..."
    
    Push-Location $ProjectRoot
    try {
        if (Test-Path $SeedScript) {
            Write-Info "Running seed script..."
            node $SeedScript
            Write-Success "Database seeded"
        }
        else {
            Write-Warning-Custom "Seed script not found at $SeedScript"
        }
    }
    catch {
        Write-Warning-Custom "Seed script completed with warnings (this is often expected)"
    }
    finally {
        Pop-Location
    }
}

function Print-Summary {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor $Green
    Write-Success "WinMix TipsterHub local development environment is ready!"
    Write-Host "========================================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📍 Service URLs:" -ForegroundColor White
    Write-Host "  Frontend:     http://localhost:8080 (or http://localhost:5173)"
    Write-Host "  Supabase:     http://localhost:54321"
    Write-Host "  Postgres:     localhost:5432"
    Write-Host "  pgAdmin:      http://localhost:5050"
    Write-Host ""
    Write-Host "🔧 Environment files:" -ForegroundColor White
    Write-Host "  Frontend env: $EnvFile"
    Write-Host "  Docker env:   $DockerEnvFile"
    Write-Host ""
    Write-Host "📖 Documentation: See docs/development/local.md for troubleshooting"
    Write-Host ""
}

function Start-DevServer {
    Write-Info "Starting Vite development server..."
    Write-Host ""
    Write-Host "Development server will run on http://localhost:8080 or http://localhost:5173"
    Write-Host "Press Ctrl+C to stop the development server"
    Write-Host ""
    
    Push-Location $ProjectRoot
    try {
        npm run dev
    }
    finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor $Blue
    Write-Host "║  WinMix TipsterHub Dev Environment     ║" -ForegroundColor $Blue
    Write-Host "║  Bootstrap Script                      ║" -ForegroundColor $Blue
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor $Blue
    Write-Host ""
    
    Check-Prerequisites
    Setup-EnvironmentFiles
    
    if (-not $SkipDependencies) {
        Install-Dependencies
    }
    
    if (-not $SkipDocker) {
        Start-DockerServices
        Verify-Services
        Seed-Database
    }
    
    Print-Summary
    Start-DevServer
}

# Run main
Main
