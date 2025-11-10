---
name: api
description: REST API development with tests and documentation
execution_mode: sequential
agents:
  - name: architect
    role: API Architect
    backend: ollama
    model: llama3.2:3b
  - name: backend
    role: Backend Developer
    backend: ollama
    model: llama3.2:3b
  - name: tester
    role: Test Engineer
    backend: ollama
    model: llama3.2:3b
  - name: documenter
    role: API Documentation Writer
    backend: ollama
    model: llama3.2:3b
---

# REST API Development

## Architect: API Design

Design a REST API for: **$TASK**

Provide:
1. Endpoint structure (resources, HTTP methods)
2. Request/Response formats
3. Authentication strategy
4. Error handling approach
5. Rate limiting strategy

---

## Backend Developer: Implementation

Implement the REST API for: **$TASK**

Based on the API design:
```
{architect}
```

Requirements:
- Use Express/Fastify with TypeScript
- Implement all endpoints
- Add validation middleware
- Add authentication/authorization
- Proper error handling

Deliverables:
- API routes
- Controllers
- Middleware
- Error handlers
- Configuration

---

## Test Engineer: API Testing

Create comprehensive tests for the API: **$TASK**

Test the implementation:
```
{backend}
```

Requirements:
- Integration tests for all endpoints
- Test authentication flows
- Test error scenarios
- Test input validation

Deliverables:
- Test suite (Jest/Supertest)
- Test fixtures
- Test utilities

---

## API Documentation Writer: OpenAPI Docs

Create OpenAPI/Swagger documentation for: **$TASK**

Document the API:
```
Architecture: {architect}
Implementation: {backend}
```

Deliverables:
- OpenAPI 3.0 specification (YAML)
- README with usage examples
- Postman collection (JSON)
