# Health Check Script for WinMix TipsterHub Local Development Environment
# PowerShell version for Windows developers
# 
# Usage: .\scripts\dev\healthcheck.ps1

param(
    [switch]$Verbose = $false
)

# Configuration
$ErrorActionPreference = "Continue"
$WarningPreference = "Continue"

$POSTGRES_HOST = $env:POSTGRES_HOST -or "localhost"
$POSTGRES_PORT = $env:POSTGRES_PORT -or 5432
$POSTGRES_USER = $env:POSTGRES_USER -or "postgres"
$POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD -or "postgres"

$SUPABASE_HOST = $env:SUPABASE_HOST -or "localhost"
$SUPABASE_REST_PORT = $env:SUPABASE_REST_PORT -or 54321

$VITE_HOST = $env:VITE_HOST -or "localhost"
$VITE_PORT_1 = $env:VITE_PORT_1 -or 8080
$VITE_PORT_2 = $env:VITE_PORT_2 -or 5173

# Colors
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Cyan

# Results tracking
$Results = @()
$PassedCount = 0
$FailedCount = 0

function Write-Check-Pass {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
    $script:PassedCount++
}

function Write-Check-Fail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
    $script:FailedCount++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Blue
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Test-Port {
    param(
        [string]$Host,
        [int]$Port,
        [string]$ServiceName
    )
    
    try {
        $Socket = New-Object System.Net.Sockets.TcpClient
        $Connect = $Socket.BeginConnect($Host, $Port, $null, $null)
        $Wait = $Connect.AsyncWaitHandle.WaitOne(5000, $false)
        
        if ($Socket.Connected) {
            Write-Check-Pass "$ServiceName is running on ${Host}:${Port}"
            $Socket.Close()
            return $true
        }
        else {
            Write-Check-Fail "$ServiceName is NOT running on ${Host}:${Port}"
            $Socket.Close()
            return $false
        }
    }
    catch {
        Write-Check-Fail "$ServiceName connection error: $_"
        return $false
    }
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [string]$ServiceName
    )
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Check-Pass "$ServiceName HTTP endpoint is responding (status: $($Response.StatusCode))"
        return $true
    }
    catch {
        Write-Check-Fail "$ServiceName HTTP endpoint is NOT responding: $($_.Exception.Message)"
        return $false
    }
}

function Test-Postgres {
    Write-Info "Checking Postgres..."
    
    # Try psql if available
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        try {
            $env:PGPASSWORD = $POSTGRES_PASSWORD
            $Result = & psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d "postgres" -c "SELECT 1" 2>$null
            
            if ($Result -match "1") {
                Write-Check-Pass "Postgres database connection is working"
                return $true
            }
        }
        catch {
            # Fall through to port check
        }
    }
    
    # Fall back to port check
    Test-Port -Host $POSTGRES_HOST -Port $POSTGRES_PORT -ServiceName "Postgres"
}

function Test-Supabase {
    Write-Info "Checking Supabase services..."
    
    # Check REST API
    Test-Port -Host $SUPABASE_HOST -Port $SUPABASE_REST_PORT -ServiceName "Supabase REST API"
    
    # Try health endpoint
    Test-HttpEndpoint -Url "http://${SUPABASE_HOST}:${SUPABASE_REST_PORT}/health" -ServiceName "Supabase Health"
}

function Test-Vite {
    Write-Info "Checking Vite development server..."
    
    # Try port 8080 first
    if (Test-Port -Host $VITE_HOST -Port $VITE_PORT_1 -ServiceName "Vite on port $VITE_PORT_1") {
        return
    }
    
    # Try port 5173 (Vite default)
    Test-Port -Host $VITE_HOST -Port $VITE_PORT_2 -ServiceName "Vite on port $VITE_PORT_2"
}

function Print-Summary {
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor $Blue
    
    if ($FailedCount -eq 0) {
        Write-Host "✓ All checks passed! ($PassedCount/$($PassedCount + $FailedCount))" -ForegroundColor $Green
    }
    else {
        Write-Host "⚠ Some checks failed ($PassedCount passed, $FailedCount failed)" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "Troubleshooting tips:" -ForegroundColor White
        Write-Host "  1. Ensure Docker is running: docker ps"
        Write-Host "  2. Check Docker Compose status: docker-compose ps"
        Write-Host "  3. View Docker logs: docker-compose logs -f"
        Write-Host "  4. For manual reset: docker-compose down && docker-compose up -d"
    }
    
    Write-Host "════════════════════════════════════════" -ForegroundColor $Blue
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor $Blue
    Write-Host "║  Health Check - Local Dev Environment  ║" -ForegroundColor $Blue
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor $Blue
    Write-Host ""
    
    Write-Info "Checking services..."
    Write-Host ""
    
    Test-Postgres
    Write-Host ""
    
    Test-Supabase
    Write-Host ""
    
    Test-Vite
    
    Print-Summary
    
    # Exit with appropriate code
    if ($FailedCount -gt 0) {
        exit 1
    }
    exit 0
}

# Run main
Main
