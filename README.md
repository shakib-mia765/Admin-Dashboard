

A production-ready full-stack Admin Dashboard built with **React**, **Vite**, **Node.js**, **Express**, **Prisma**, and modern engineering best practices. This project follows a scalable **monorepo architecture** designed for enterprise-grade applications with a strong focus on maintainability, security, performance, and developer experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Vite](https://img.shields.io/badge/Vite-7-646CFF)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-success)

---

# Overview

UltraFAANG Admin Dashboard demonstrates a modern enterprise application architecture combining a React frontend with a Node.js backend inside a scalable monorepo.

The repository is organized to support large engineering teams by separating frontend, backend, and shared packages while maintaining a clean developer experience.

---

# Features

- Secure Authentication
- Dashboard Analytics
- User Management
- Permission-based Authorization
- RESTful API
- Prisma ORM
- Shared Validation Package
- Docker Support
- GitHub Actions CI
- Enterprise Folder Structure
- Production-ready Configuration
- Error Handling Middleware
- Authentication Middleware
- Environment Configuration
- Modular Backend Architecture

---

# Repository Structure

```text
ultrafaang-admin-dashboard/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   ├── web/
│   └── server/
│
├── packages/
│   └── validation/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Technology Stack

## Frontend

- React 19
- Vite 7
- React Router
- Tailwind CSS
- JavaScript (ES2024)

## Backend

- Node.js
- Express.js
- Prisma ORM

## Database

- PostgreSQL

## DevOps

- Docker
- GitHub Actions
- ESLint
- PNPM Workspace

---

# Project Architecture

```text
                   Browser
                      │
                      ▼
              React Application
                      │
                      ▼
                 REST API Layer
                      │
                      ▼
                Express Server
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
 Authentication   Dashboard      User Module
      │               │               │
      └───────────────┼───────────────┘
                      ▼
                 Prisma ORM
                      │
                      ▼
                 PostgreSQL
```

---

# Folder Overview

## apps/web

Contains the complete frontend application.

```text
public/
src/
 ├── app/
 ├── components/
 ├── features/
 ├── layouts/
 ├── lib/
 ├── store/
 ├── styles/
 └── main.jsx
```

---

## apps/server

Contains backend services and REST APIs.

```text
prisma/
src/
 ├── config/
 ├── middleware/
 ├── modules/
 ├── shared/
 ├── app.js
 └── server.js
```

---

## packages/validation

Shared validation utilities used across frontend and backend.

---

# Getting Started

## Clone Repository

```bash
git clone https://github.com/shakib-mia765/Admin-Dashboard.git
```

```bash
cd Admin-Dashboard
```

---

# Install Dependencies

Using npm

```bash
npm install
```

Using pnpm

```bash
pnpm install
```

---

# Environment Setup

Copy

```text
.env.example
```

to

```text
.env
```

Configure

- Database URL
- JWT Secret
- Application Port
- Client URL

---

# Database

Generate Prisma Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev
```

Seed Database

```bash
node apps/server/prisma/seed.js
```

---

# Development

Run Entire Workspace

```bash
npm run dev
```

Run Frontend

```bash
npm run dev:web
```

Run Backend

```bash
npm run dev:server
```

---

# Build

```bash
npm run build
```

---

# Test

```bash
npm test
```

---

# Lint

```bash
npm run lint
```

---

# Docker

Start Development Environment

```bash
docker compose up
```

Stop Environment

```bash
docker compose down
```

---

# Continuous Integration

GitHub Actions automatically executes

- Install Dependencies
- Lint
- Build
- Test

Workflow

```text
.github/workflows/ci.yml
```

---

# Security

Project includes

- Authentication Middleware
- Authorization Layer
- Shared Validation
- Environment Isolation
- Centralized Error Handling
- Modular Architecture
- Secure Configuration Management

---

# Monorepo Layout

```text
apps/
    web/
    server/

packages/
    validation/
```

---

# Future Improvements

- Refresh Token Authentication
- Role-Based Access Control
- Audit Logs
- Multi-tenancy
- Redis Cache
- Background Jobs
- WebSocket Support
- Metrics Dashboard
- Distributed Caching
- API Rate Limiting

---

# Contributing

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push the branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# License

This project is licensed under the **MIT License**.

---

# About the Author

## Shakib Mia

**Staff Full Stack Engineer | Software Architect | 9+ Years of Professional Experience**

Experienced Full Stack Engineer with more than **9 years of professional experience** building scalable, secure, and high-performance web applications. Passionate about modern software architecture, cloud-native development, backend engineering, frontend engineering, DevOps, and developer experience.

### Core Expertise

- React
- Vite
- JavaScript (ES2024)
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- REST APIs
- Authentication & Authorization
- Docker
- GitHub Actions
- CI/CD
- System Design
- Monorepo Architecture

### GitHub

**https://github.com/shakib-mia765**

---

## Thank You

If you found this project useful, please consider giving it a ⭐ on GitHub.

---

Built with ❤️ by **Shakib Mia**  
**Staff Full Stack Engineer • Software Architect • 9+ Years of Professional Experience**
```text
ultrafaang-admin-dashboard/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── router.jsx
│   │   │   │   ├── providers.jsx
│   │   │   │   └── App.jsx
│   │   │   ├── components/
│   │   │   │   ├── DataTable.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthPage.jsx
│   │   │   │   │   └── auth.api.js
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── DashboardPage.jsx
│   │   │   │   └── users/
│   │   │   │       ├── UsersPage.jsx
│   │   │   │       └── users.api.js
│   │   │   ├── layouts/
│   │   │   │   └── AdminLayout.jsx
│   │   │   ├── lib/
│   │   │   │   ├── api.js
│   │   │   │   └── permissions.js
│   │   │   ├── store/
│   │   │   │   └── store.js
│   │   │   ├── styles/
│   │   │   │   └── index.css
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.js
│       ├── src/
│       │   ├── config/
│       │   │   └── env.js
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   └── error-handler.js
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   └── auth.module.js
│       │   │   ├── dashboard/
│       │   │   │   └── dashboard.module.js
│       │   │   └── users/
│       │   │       └── users.module.js
│       │   ├── shared/
│       │   │   ├── database.js
│       │   │   ├── logger.js
│       │   │   └── response.js
│       │   ├── app.js
│       │   └── server.js
│       ├── tests/
│       │   └── api.test.js
│       └── package.json
├── packages/
│   └── validation/
│       ├── src/
│       │   └── index.js
│       └── package.json
├── .env.example
├── .gitignore
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
└── README.md
```
