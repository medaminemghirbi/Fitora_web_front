<<<<<<< HEAD
# Fitora — Frontend

**Fitora** is a modern fitness and wellness platform designed to connect users with fitness services, companies, coaches, and personalized experiences.

🌐 **Production:** [fitora.com](https://fitora.com?utm_source=chatgpt.com)

This repository contains the **Fitora frontend**, built with **Angular** and designed to communicate with the Fitora backend API.

---

## 🚀 Tech Stack

* **Angular 17**
* **TypeScript**
* **RxJS**
* **SCSS / CSS**
* **Angular Router**
* **REST API**
* **Responsive Web Design**

---

## 📋 Requirements

Before running the project locally, make sure you have:

* **Node.js** 18+
* **npm** 9+
* **Angular CLI** 17+

Check your versions:

```bash
node -v
npm -v
ng version
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone <repository-url>
cd fitora_frontend
```

Install dependencies:

```bash
npm install
```

---

## 💻 Development

Start the development server:

```bash
ng serve
```

Then open:

```text
http://localhost:4200
```

The application will automatically reload when source files are modified.

---

## 🏗️ Production Build

Create a production build:

```bash
ng build --configuration production
```

The generated files will be available in:

```text
dist/
```

The production build can then be deployed to your web server or hosting provider.

---

## 🌍 Environment Configuration

Environment-specific configuration is managed through Angular environments.

Typical configuration includes:

* API URL
* Application URL
* Environment name
* Authentication configuration
* Third-party services

Example:

```text
src/environments/
├── environment.ts
└── environment.prod.ts
```

**Never commit sensitive credentials or secrets to the repository.**

---

## 🧪 Testing

Run unit tests:

```bash
ng test
```

End-to-end testing can be added using the preferred E2E framework.

---

## 🧩 Code Scaffolding

Generate Angular components, services, guards, pipes, etc. using the Angular CLI.

Examples:

```bash
ng generate component components/example
```

```bash
ng generate service services/example
```

```bash
ng generate guard guards/auth
```

You can also use the shorter syntax:

```bash
ng g c components/example
ng g s services/example
ng g g guards/auth
```

---

## 📁 Project Structure

A simplified project structure:

```text
src/
├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── app.routes.ts
│
├── assets/
├── environments/
├── styles.scss
└── main.ts
```

The exact structure may evolve as the application grows.

---

## 🔐 Authentication

Fitora uses an authenticated API architecture.

Frontend responsibilities include:

* User authentication
* Session/token handling
* Protected routes
* API authentication
* Role-based UI access
* Error handling

Authentication logic should remain centralized in the appropriate services, guards, and HTTP interceptors.

---

## 🔌 Backend

The frontend communicates with the **Fitora backend API**.

The backend is responsible for:

* Authentication and authorization
* Users
* Companies
* Subscriptions
* Clients
* Coaches
* Fitness services
* Business logic
* Data persistence

Frontend and backend should be configured independently through environment variables.

---

## 🚀 Deployment

The production application is deployed under:

**https://fitora.com**

For a production deployment:

```bash
npm ci
ng build --configuration production
```

Deploy the generated contents from:

```text
dist/
```

### SPA Routing

Because Fitora is an Angular Single Page Application, the web server must redirect unknown routes to:

```text
index.html
```

For example:

```text
fitora.com/login
fitora.com/dashboard
fitora.com/company/...
```

should all be handled by Angular's router.

---

## 🛠️ Useful Commands

| Command                               | Description               |
| ------------------------------------- | ------------------------- |
| `npm install`                         | Install dependencies      |
| `ng serve`                            | Start development server  |
| `ng build`                            | Build the application     |
| `ng build --configuration production` | Production build          |
| `ng test`                             | Run unit tests            |
| `ng lint`                             | Run linting if configured |
| `ng generate`                         | Generate Angular code     |

---

## 📌 Development Guidelines

Before opening a pull request:

1. Keep components focused and reusable.
2. Keep API communication inside services.
3. Avoid duplicating business logic.
4. Protect authenticated routes with guards.
5. Use environment configuration for environment-specific values.
6. Do not commit secrets or credentials.
7. Test production builds before deployment.
8. Keep UI responsive across desktop and mobile.

---

## 📄 License

This project is proprietary software.

© Fitora. All rights reserved.
=======
# Fitora

Multi-tenant management platform. Monorepo:

| Path        | Stack                                          |
|-------------|------------------------------------------------|
| `backend/`  | Rails 8 API-only · PostgreSQL · Sidekiq         |
| `frontend/` | Angular · standalone components                |
| `mobile/`   | Expo / React Native *(separate repo for now)*   |

Each app keeps its own README, `.gitignore`, and dependency manifests.
History for `backend/` and `frontend/` was preserved when the three
original repos were merged (Sept 2026); `backend/production.dump` was
scrubbed from history at that time.

## Getting started

```
cd backend  && bundle install && bin/rails db:setup && bin/dev
cd frontend && npm install    && npm start
```
>>>>>>> 81844ec (chore: initialize Fitora monorepo root)
