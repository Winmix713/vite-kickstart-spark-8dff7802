#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"
DOCKER_ENV_FILE="$PROJECT_ROOT/docker/.env"

# Configuration variables
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
HEALTHCHECK_SCRIPT="$SCRIPT_DIR/healthcheck.sh"
SEED_SCRIPT="$PROJECT_ROOT/scripts/seed-database.mjs"

# Function to print colored output
print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
  print_info "Checking prerequisites..."

  if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker to continue."
    exit 1
  fi
  print_success "Docker installed"

  if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose to continue."
    exit 1
  fi
  print_success "Docker Compose installed"

  if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js to continue."
    exit 1
  fi
  print_success "Node.js installed"

  if ! command_exists npm; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
  fi
  print_success "npm installed"
}

# Function to setup environment files
setup_env_files() {
  print_info "Setting up environment files..."

  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$PROJECT_ROOT/.env.local.template" ]; then
      cp "$PROJECT_ROOT/.env.local.template" "$ENV_FILE"
      print_success "Created $ENV_FILE from template"
    else
      print_warning "No .env.local.template found, creating minimal .env.local"
      cat > "$ENV_FILE" << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PROJECT_ID=wclutzbojatqtxwlvtab
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTYzODQsImV4cCI6MjA3Nzc3MjM4NH0.GcFqrEtZhgEHq0ycfXPFwebBcUrOiO2LlOrLEWhkmnE
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTYzODQsImV4cCI6MjA3Nzc3MjM4NH0.GcFqrEtZhgEHq0ycfXPFwebBcUrOiO2LlOrLEWhkmnE
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbHV0emJvamF0cXR4d2x2dGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NjM4NCwiZXhwIjoyMDc3NzcyMzg0fQ.5YhI1X7gCsQ6l4vIZvYrJ8T4cP1M9jN6K8L3Q2R5W0A
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
EOF
    fi
  else
    print_success "Found existing .env.local"
  fi

  if [ ! -f "$DOCKER_ENV_FILE" ]; then
    if [ -f "$PROJECT_ROOT/docker/.env.example" ]; then
      cp "$PROJECT_ROOT/docker/.env.example" "$DOCKER_ENV_FILE"
      print_success "Created $DOCKER_ENV_FILE from example"
    fi
  fi
}

# Function to start Docker services
start_docker_services() {
  print_info "Starting Docker services..."

  cd "$PROJECT_ROOT"
  
  # Load docker env file
  if [ -f "$DOCKER_ENV_FILE" ]; then
    export $(cat "$DOCKER_ENV_FILE" | grep -v '^#' | xargs)
  fi

  # Check if containers are already running
  if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
    print_warning "Some containers are already running. Use 'docker-compose down' to stop them first if needed."
  fi

  docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

  print_success "Docker services started"
  
  # Wait for services to be healthy
  print_info "Waiting for services to become healthy..."
  sleep 10
}

# Function to verify services are running
verify_services() {
  print_info "Verifying services..."

  if [ ! -f "$HEALTHCHECK_SCRIPT" ]; then
    print_warning "Healthcheck script not found at $HEALTHCHECK_SCRIPT"
    print_info "Attempting basic connectivity checks..."
    
    # Basic checks
    if ! nc -z localhost 5432 2>/dev/null; then
      print_error "Postgres is not responding on port 5432"
      exit 1
    fi
    print_success "Postgres is responding"
    
    if ! nc -z localhost 54321 2>/dev/null; then
      print_error "Supabase REST API is not responding on port 54321"
      exit 1
    fi
    print_success "Supabase is responding"
  else
    bash "$HEALTHCHECK_SCRIPT"
  fi
}

# Function to run database reset and seed
seed_database() {
  print_info "Seeding database..."

  cd "$PROJECT_ROOT"
  
  # Source the .env.local file to get database credentials
  if [ -f "$ENV_FILE" ]; then
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
  fi

  # Run seed script if it exists
  if [ -f "$SEED_SCRIPT" ]; then
    print_info "Running seed script..."
    node "$SEED_SCRIPT" || print_warning "Seed script completed with issues (this is often expected)"
    print_success "Database seeded"
  else
    print_warning "Seed script not found at $SEED_SCRIPT"
  fi
}

# Function to install dependencies
install_dependencies() {
  print_info "Installing npm dependencies..."

  cd "$PROJECT_ROOT"
  npm install
  print_success "Dependencies installed"
}

# Function to start Supabase edge functions
start_edge_functions() {
  print_info "Starting Supabase edge functions (if available)..."

  # Check if supabase CLI is installed
  if command_exists supabase; then
    cd "$PROJECT_ROOT"
    supabase functions serve --no-verify-jwt &
    SUPABASE_FUNCTIONS_PID=$!
    print_success "Edge functions started (PID: $SUPABASE_FUNCTIONS_PID)"
  else
    print_warning "Supabase CLI not installed. Skipping edge functions setup."
    print_info "Install with: npm install -g @supabase/supabase-js @supabase/cli"
  fi
}

# Function to start development server
start_dev_server() {
  print_info "Starting Vite development server..."

  cd "$PROJECT_ROOT"
  print_info "Development server will run on http://localhost:8080 or http://localhost:5173"
  print_info "Press Ctrl+C to stop the development server"
  
  npm run dev
}

# Function to display summary
print_summary() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  print_success "WinMix TipsterHub local development environment is ready!"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "📍 Service URLs:"
  echo "  Frontend:     http://localhost:8080 (or http://localhost:5173)"
  echo "  Supabase:     http://localhost:54321"
  echo "  Postgres:     localhost:5432"
  echo "  pgAdmin:      http://localhost:5050"
  echo ""
  echo "🔧 Environment files:"
  echo "  Frontend env: $ENV_FILE"
  echo "  Docker env:   $DOCKER_ENV_FILE"
  echo ""
  echo "📖 Documentation: See docs/development/local.md for troubleshooting"
  echo ""
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════╗"
  echo "║  WinMix TipsterHub Dev Environment     ║"
  echo "║  Bootstrap Script                      ║"
  echo "╚════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""

  check_prerequisites
  setup_env_files
  install_dependencies
  start_docker_services
  verify_services
  seed_database
  
  print_summary
  
  # Optional: start edge functions
  # Uncomment to enable
  # start_edge_functions

  # Start development server
  start_dev_server
}

# Run main function
main "$@"
