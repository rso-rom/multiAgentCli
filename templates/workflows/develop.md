---
name: develop
description: Full-stack development workflow with architecture, code, tests, and documentation
execution_mode: sequential
agents:
  - name: architect
    role: Software Architect
    backend: ollama
    model: llama3.2:3b
  - name: backend
    role: Backend Developer
    backend: ollama
    model: llama3.2:3b
  - name: frontend
    role: Frontend Developer
    backend: ollama
    model: llama3.2:3b
  - name: database
    role: Database Designer
    backend: ollama
    model: llama3.2:3b
  - name: tester
    role: Test Engineer
    backend: ollama
    model: llama3.2:3b
  - name: devops
    role: DevOps Engineer
    backend: ollama
    model: llama3.2:3b
  - name: documenter
    role: Technical Writer
    backend: ollama
    model: llama3.2:3b
---

# Software Development Workflow

## Architect: System Design

You are a Software Architect. Create a comprehensive architecture for: **$TASK**

Please provide:

1. **System Overview**
   - High-level architecture diagram (ASCII/Mermaid)
   - Core components and their responsibilities
   - Data flow between components

2. **Technology Stack**
   - Backend framework and language
   - Frontend framework
   - Database choice and reasoning
   - External services/APIs needed

3. **API Design**
   - REST/GraphQL endpoints
   - Request/Response formats
   - Authentication strategy

4. **Non-functional Requirements**
   - Scalability considerations
   - Security measures
   - Performance targets

---

## Backend: Implementation

Based on the architecture above, implement the backend for: **$TASK**

Requirements:
- Use the technology stack defined by the architect
- Implement all defined API endpoints
- Add proper error handling
- Include input validation
- Use TypeScript for type safety

**Context from Architect:**
```
{architect}
```

Deliverables:
- Core business logic
- API routes/controllers
- Data models/entities
- Middleware (auth, validation, error handling)
- Configuration files

---

## Frontend: UI Implementation

Based on the architecture, create the frontend for: **$TASK**

Requirements:
- Use the frontend framework from the architecture
- Implement all screens/views
- Connect to backend API endpoints
- Add responsive design
- Use TypeScript for type safety

**Context from Architect:**
```
{architect}
```

**Backend API available:**
```
{backend}
```

Deliverables:
- Component structure
- State management setup
- API integration layer
- Routing configuration
- Styling approach

---

## Database: Schema & Migrations

Create the database schema for: **$TASK**

Requirements:
- Use the database from the architecture
- Define all tables/collections
- Add proper indexes
- Define relationships and constraints
- Include sample data/seeds

**Context from Architect:**
```
{architect}
```

Deliverables:
- SQL/NoSQL schema definitions
- Migration files
- Seed data scripts
- ER diagram (ASCII/Mermaid)

---

## Tester: Comprehensive Testing

Create a complete test suite for: **$TASK**

Requirements:
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage goals (>80%)

**Backend to test:**
```
{backend}
```

**Frontend to test:**
```
{frontend}
```

Deliverables:
- Unit test files
- Integration test suite
- E2E test scenarios
- Test configuration (Jest/Vitest/Playwright)
- CI test commands

---

## Devops: Deployment Setup

Create deployment configuration for: **$TASK**

Requirements:
- Docker containerization
- CI/CD pipeline (GitHub Actions/GitLab CI)
- Environment configuration
- Monitoring and logging setup

**Tech stack:**
```
{architect}
```

Deliverables:
- Dockerfile(s)
- docker-compose.yml
- CI/CD pipeline config
- Environment variables template
- Deployment scripts

---

## Documenter: Documentation

Create comprehensive documentation for: **$TASK**

Requirements:
- README.md with setup instructions
- API documentation (OpenAPI/Swagger)
- Architecture documentation
- Developer guide

**Full context:**
```
Architecture: {architect}
Backend: {backend}
Frontend: {frontend}
Database: {database}
Tests: {tester}
DevOps: {devops}
```

Deliverables:
- README.md (project overview, setup, usage)
- API.md (endpoint documentation)
- ARCHITECTURE.md (system design, decisions)
- CONTRIBUTING.md (development guidelines)
