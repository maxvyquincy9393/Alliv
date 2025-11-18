# ==============================================================================
# COLABMATCH Makefile
# ==============================================================================
# Common commands for development, testing, and deployment
# ==============================================================================

.PHONY: help install dev test lint format clean docker-build docker-up docker-down security-check

# Default target
.DEFAULT_GOAL := help

# Colors
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

##@ General

help: ## Display this help message
	@echo "$(CYAN)COLABMATCH - Available Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

install: ## Install all dependencies (backend & frontend)
	@echo "$(CYAN)Installing backend dependencies...$(NC)"
	cd backend && python -m venv .venv && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		pip install -r requirements.txt -r requirements-test.txt
	@echo "$(CYAN)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✅ All dependencies installed$(NC)"

setup: install ## Complete development setup
	@echo "$(CYAN)Running setup script...$(NC)"
	@bash scripts/setup-dev.sh || scripts\setup-dev.bat

##@ Development

dev-backend: ## Start backend development server
	cd backend && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		uvicorn app.main:socket_app --reload --port 8080

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

dev: ## Start both backend and frontend (requires 2 terminals)
	@echo "$(YELLOW)Start backend in one terminal: make dev-backend$(NC)"
	@echo "$(YELLOW)Start frontend in another terminal: make dev-frontend$(NC)"

##@ Testing

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(CYAN)Running backend tests...$(NC)"
	cd backend && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		pytest -v

test-backend-cov: ## Run backend tests with coverage
	@echo "$(CYAN)Running backend tests with coverage...$(NC)"
	cd backend && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		pytest --cov=app --cov-report=html --cov-report=term

test-frontend: ## Run frontend tests
	@echo "$(CYAN)Running frontend tests...$(NC)"
	cd frontend && npm test -- --run

test-e2e: ## Run E2E tests
	@echo "$(CYAN)Running E2E tests...$(NC)"
	cd frontend && npm run test:e2e

##@ Code Quality

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend code
	@echo "$(CYAN)Linting backend...$(NC)"
	cd backend && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		black --check . && \
		ruff check . && \
		flake8

lint-frontend: ## Lint frontend code
	@echo "$(CYAN)Linting frontend...$(NC)"
	cd frontend && npm run lint

format: format-backend format-frontend ## Format all code

format-backend: ## Format backend code
	@echo "$(CYAN)Formatting backend...$(NC)"
	cd backend && \
		(. .venv/bin/activate || .venv\Scripts\activate) && \
		black . && \
		ruff check --fix .

format-frontend: ## Format frontend code
	@echo "$(CYAN)Formatting frontend...$(NC)"
	cd frontend && npm run format

##@ Security

security-check: ## Run security audit
	@echo "$(CYAN)Running security checks...$(NC)"
	@bash scripts/security-check.sh

audit-frontend: ## Audit frontend dependencies
	cd frontend && npm audit

audit-backend: ## Audit backend dependencies
	cd backend && pip-audit || (echo "$(YELLOW)Install pip-audit: pip install pip-audit$(NC)")

##@ Docker

docker-build: ## Build Docker images
	@echo "$(CYAN)Building Docker images...$(NC)"
	docker-compose build

docker-up: ## Start all services with Docker
	@echo "$(CYAN)Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services started$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8080"
	@echo "API Docs: http://localhost:8080/docs"

docker-down: ## Stop all Docker services
	@echo "$(CYAN)Stopping services...$(NC)"
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Remove all Docker containers and volumes
	docker-compose down -v
	docker system prune -f

##@ Database

db-start: ## Start MongoDB and Redis only
	docker-compose up -d mongo redis

db-stop: ## Stop MongoDB and Redis
	docker-compose stop mongo redis

##@ Utilities

clean: ## Clean build artifacts and cache
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	rm -rf backend/.pytest_cache backend/__pycache__ backend/.ruff_cache backend/.mypy_cache
	rm -rf frontend/dist frontend/node_modules/.cache frontend/coverage
	rm -rf frontend/test-results frontend/playwright-report
	@echo "$(GREEN)✅ Cleaned$(NC)"

generate-secrets: ## Generate secure JWT secrets
	cd backend && python generate_secrets.py

logs: docker-logs ## Alias for docker-logs

health: ## Check health of all services
	@echo "$(CYAN)Checking service health...$(NC)"
	@curl -f http://localhost:8080/health || echo "$(YELLOW)Backend not responding$(NC)"
	@curl -f http://localhost:3000/health || echo "$(YELLOW)Frontend not responding$(NC)"

##@ Information

info: ## Display project information
	@echo "$(CYAN)COLABMATCH Project Information$(NC)"
	@echo ""
	@echo "Stack:"
	@echo "  Backend:  FastAPI + Python 3.11 + MongoDB + Redis"
	@echo "  Frontend: React + TypeScript + Vite"
	@echo ""
	@echo "Services:"
	@echo "  Frontend: http://localhost:5173 (dev) / http://localhost:3000 (docker)"
	@echo "  Backend:  http://localhost:8080"
	@echo "  API Docs: http://localhost:8080/docs"
	@echo ""
	@echo "Useful commands:"
	@echo "  make help           - Show all available commands"
	@echo "  make setup          - Complete development setup"
	@echo "  make dev-backend    - Start backend server"
	@echo "  make dev-frontend   - Start frontend server"
	@echo "  make test           - Run all tests"
	@echo "  make docker-up      - Start with Docker"
	@echo ""




