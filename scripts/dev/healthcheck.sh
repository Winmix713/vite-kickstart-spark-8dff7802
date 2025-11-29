#!/bin/bash

# Health check script for WinMix TipsterHub local development environment
# Verifies that Postgres, Supabase, and Vite services are running and healthy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

SUPABASE_HOST=${SUPABASE_HOST:-localhost}
SUPABASE_REST_PORT=${SUPABASE_REST_PORT:-54321}
SUPABASE_FUNCTIONS_PORT=${SUPABASE_FUNCTIONS_PORT:-54322}

VITE_HOST=${VITE_HOST:-localhost}
VITE_PORT_1=${VITE_PORT_1:-8080}
VITE_PORT_2=${VITE_PORT_2:-5173}

# Counters for pass/fail
PASSED=0
FAILED=0

# Function to print colored output
print_check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

print_check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Function to check if port is open
check_port() {
  local host=$1
  local port=$2
  local service=$3
  
  if nc -z "$host" "$port" 2>/dev/null; then
    print_check_pass "$service is running on $host:$port"
    return 0
  else
    print_check_fail "$service is NOT running on $host:$port"
    return 1
  fi
}

# Function to check HTTP endpoint
check_http() {
  local url=$1
  local service=$2
  
  if curl -s -f "$url" > /dev/null 2>&1; then
    print_check_pass "$service HTTP endpoint is healthy"
    return 0
  else
    print_check_fail "$service HTTP endpoint is NOT responding"
    return 1
  fi
}

# Function to check Postgres connection
check_postgres() {
  if command -v psql &> /dev/null; then
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -c "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      print_check_pass "Postgres database connection is working"
      return 0
    else
      print_check_fail "Postgres database connection failed"
      return 1
    fi
  else
    print_warning "psql not installed, skipping detailed Postgres check"
    check_port "$POSTGRES_HOST" "$POSTGRES_PORT" "Postgres"
    return $?
  fi
}

# Function to check Supabase
check_supabase() {
  print_info "Checking Supabase services..."
  
  # Check REST API
  check_port "$SUPABASE_HOST" "$SUPABASE_REST_PORT" "Supabase REST API"
  local rest_status=$?
  
  # Check edge functions runtime (optional, may not be available)
  if nc -z "$SUPABASE_HOST" "$SUPABASE_FUNCTIONS_PORT" 2>/dev/null; then
    print_check_pass "Supabase Edge Functions runtime is available on $SUPABASE_HOST:$SUPABASE_FUNCTIONS_PORT"
  fi
  
  return $rest_status
}

# Function to check Vite dev server
check_vite() {
  print_info "Checking Vite development server..."
  
  # Try port 8080 first
  if nc -z "$VITE_HOST" "$VITE_PORT_1" 2>/dev/null; then
    print_check_pass "Vite dev server is running on $VITE_HOST:$VITE_PORT_1"
    return 0
  fi
  
  # Try port 5173 (Vite default)
  if nc -z "$VITE_HOST" "$VITE_PORT_2" 2>/dev/null; then
    print_check_pass "Vite dev server is running on $VITE_HOST:$VITE_PORT_2"
    return 0
  fi
  
  print_check_fail "Vite dev server is NOT running (expected if bootstrap just started)"
  return 1
}

# Function to display summary
print_summary() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════${NC}"
  
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! ($PASSED/$((PASSED + FAILED)))${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ Some checks failed ($PASSED passed, $FAILED failed)${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "  1. Ensure Docker is running: docker ps"
    echo "  2. Check Docker Compose status: docker-compose ps"
    echo "  3. View Docker logs: docker-compose logs -f"
    echo "  4. For manual reset: docker-compose down && docker-compose up -d"
    echo ""
    return 1
  fi
}

# Function to check if nc (netcat) is available
check_netcat() {
  if ! command -v nc &> /dev/null; then
    print_warning "netcat (nc) not found. Installing or using alternative method..."
    
    # Try to use bash's built-in TCP redirection if available
    if ! (echo >/dev/tcp/localhost/5432) 2>/dev/null; then
      print_warning "Cannot verify services without netcat or TCP support"
      print_info "Install netcat with: apt-get install netcat-openbsd (Linux) or brew install netcat (macOS)"
      return 1
    fi
  fi
  return 0
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════╗"
  echo "║  Health Check - Local Dev Environment  ║"
  echo "╚════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""

  check_netcat || {
    print_warning "Skipping detailed checks due to missing tools"
    exit 1
  }

  # Run all checks
  print_info "Checking services..."
  echo ""
  
  check_postgres
  check_supabase
  check_vite
  
  echo ""
  print_summary
}

# Run main function
main "$@"
