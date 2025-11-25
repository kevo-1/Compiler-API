# Multi-Language Code Compiler API

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,nodejs,nestjs,docker" alt="Core Stack" />
</p>

A secure, containerized code execution service built with NestJS that supports multiple programming languages through Docker-based sandboxing.

## Overview

This project provides a REST API for compiling and executing code in a safe, isolated environment. Each code submission is queued, executed in a resource-constrained Docker container, and returns detailed execution results including output, errors, and performance metrics.

## Architecture

### System Design

The application follows a layered architecture pattern:

- **Controller Layer**: Handles HTTP requests and routes them to the appropriate service
- **Queue Service**: Manages asynchronous job processing with UUID-based request tracking
- **Compiler Service**: Routes code to language-specific compiler services
- **Sandbox Services**: Language-specific execution handlers that spawn isolated Docker containers
- **Cleanup Service**: Manages Docker process lifecycle and ensures proper resource cleanup

### Request Flow

1. Client submits code via POST request to `/compiler/:language`
2. Queue service generates unique ID and enqueues the request
3. Background processor routes to appropriate compiler service
4. Code executes in isolated Docker container with resource limits
5. Results are stored and available via GET `/compiler/:id`

### Security Model

Each execution environment is isolated using Docker with strict resource constraints:

- Memory limits (128MB-512MB depending on language)
- CPU throttling (0.5-1.0 cores)
- Network isolation (no external network access)
- Process limits (maximum 50 processes)
- Execution timeouts (5-20 seconds)
- Output size limits (1MB maximum)

## Technology Stack

### Core Framework

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,nodejs,nestjs" alt="Framework Stack" />
</p>

- **NestJS**: Backend framework with dependency injection and modular architecture
- **Node.js**: Runtime environment
- **TypeScript**: Primary programming language

### Infrastructure

<p align="center">
  <img src="https://skillicons.dev/icons?i=docker" alt="Infrastructure" />
</p>

- **Docker**: Container runtime for sandboxed code execution
- **Child Process**: Native Node.js module for spawning Docker containers

### Language Support

<p align="center">
  <img src="https://skillicons.dev/icons?i=js,ts,python,go,c,cpp" alt="Supported Languages" />
</p>

- JavaScript (Node.js Alpine)
- TypeScript (ts-node with strict compiler options)
- Python (Alpine-based)
- Go (Alpine-based with GO111MODULE)
- C (GCC with compilation and execution)
- C++ (G++ with compilation and execution)

### Development Tools
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Jest**: Testing framework

## Installation

### Prerequisites

- Node.js (v18 or higher)
- Docker Engine
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Build Docker images for language environments:
```bash
docker build -t c-runner -f docker/Dockerfile.c .
docker build -t go-runner -f docker/Dockerfile.go .
docker build -t ts-runner -f docker/Dockerfile.typescript .
```

4. Start the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Usage

### Submit Code for Compilation

```http
POST /compiler/:language
Content-Type: application/json

{
  "code": "console.log('Hello World');"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "status": "PENDING"
}
```

### Check Compilation Status

```http
GET /compiler/:id
```

**Response:**
```json
{
  "id": "uuid-string",
  "language": "javascript",
  "status": "COMPLETED",
  "result": {
    "success": true,
    "output": "Hello World\n",
    "error": "",
    "exitCode": 0,
    "executionTime": 245,
    "language": "JavaScript",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Supported Languages

- `javascript`
- `typescript`
- `python`
- `go`
- `c`
- `cpp`

## Development

### Project Structure

```
app/
├── src/
│   ├── sandboxEnv/          # Language-specific compiler services
│   │   ├── jsEnv/
│   │   ├── tsEnv/
│   │   ├── pyEnv/
│   │   ├── goEnv/
│   │   ├── cEnv/
│   │   └── cppEnv/
│   ├── interfaces/          # TypeScript interfaces
│   ├── dto/                 # Data transfer objects
│   ├── compiler.controller.ts
│   ├── compiler.service.ts
│   ├── compilation-queue.service.ts
│   ├── docker-cleanup.service.ts
│   └── main.ts
├── docker/                  # Dockerfile configurations
└── test/                    # E2E tests
```

### Available Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build for production
- `npm run test` - Run unit tests

## Features

- Asynchronous job queue with status tracking
- Comprehensive error handling and validation
- Automatic Docker container cleanup
- Graceful shutdown with process cleanup
- Detailed execution metrics
- Support for compilation and runtime errors
- Output truncation for large results
- Memory and CPU resource limits
