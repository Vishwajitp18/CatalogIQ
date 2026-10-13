# ⚡ CatalogIQ — Product Management & AI-Powered Search Platform

> **Full Stack Development Intern – Technical Assignment**  
> A production-grade, enterprise-ready product catalog management system featuring **Django 5.1 REST Framework**, **PostgreSQL 17**, **React 19 + Vite**, and **Groq Qwen 2.5 27B GenAI**.

---

## 🌐 Application Links

| Resource | URL |
| :--- | :--- |
| **Live Frontend Application** | `[FRONTEND_URL_PLACEHOLDER]` *(e.g. `https://catalogiq.vercel.app`)* |
| **Backend REST API** | `[BACKEND_URL_PLACEHOLDER]` *(e.g. `https://catalogiq-api.onrender.com`)* |
| **Interactive Swagger API Docs** | `[BACKEND_URL_PLACEHOLDER]/api/docs/` |
| **OpenAPI Schema (JSON)** | `[BACKEND_URL_PLACEHOLDER]/api/schema/` |
| **GitHub Repository** | `https://github.com/Vishwajitp18/CatalogIQ` |

---

## 📋 Executive Overview

**CatalogIQ** is a full-stack e-commerce catalog management and intelligent search engine designed to solve the challenges of modern product discovery and catalog operations.

Standard e-commerce search engines struggle with conversational or multi-parameter intent (e.g., *"Show me wireless Bose headphones with active noise cancellation under ₹25,000"*), while pure LLM generative chatbots frequently hallucinate nonexistent inventory and prices. 

**CatalogIQ bridges this gap with a hybrid architecture**:
1. **AI Query Intelligence**: Groq's high-speed inference engine (`qwen/qwen3.8-27b`) interprets conversational natural language queries into strict, validated JSON search parameters.
2. **Zero-Hallucination Deterministic Retrieval**: The structured parameters are executed directly against PostgreSQL via Django ORM selectors, ensuring 100% accurate real-time inventory, pricing, and availability.
3. **AI Copywriter Studio**: Transforms raw bullet points into polished, high-converting product descriptions and SEO hashtags across multiple brand voice tones.
4. **Enterprise Multi-Device Session Security**: Dual-token authentication with opaque refresh tokens stored as SHA-256 hashes, automatic rotation with token-theft detection grace windows, sliding session expiration, and remote device revocation.
5. **Modern Production UI/UX**: Responsive Apple Pro / Neo-Bento design system supporting true Dark and Light modes, custom accessible controls (WCAG 2.2 AA compliant), Bento statistics cards, and dual Grid/Table browsing.

---

## 🏗️ System Architecture

```
                                      ┌──────────────────────────────────────────────┐
                                      │             React 19 + Vite UI               │
                                      │    (Tailwind CSS • Dark/Light Mode Theme)    │
                                      └──────────────────────┬───────────────────────┘
                                                             │ HTTPS / REST (Axios)
                                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  Django 5.1 Backend                                                    │
│                                                                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐ │
│  │     apps.accounts     │  │            apps.catalog            │  │       apps.genai       │  │     apps.core      │ │
│  │  - Custom User Model  │  │  - Product, Brand, Category Models │  │  - Groq Qwen Provider  │  │  - Request ID MW   │ │
│  │  - Hashed UserSession │  │  - Faceted Selectors (Read)        │  │  - Structured Output   │  │  - Access Logger   │ │
│  │  - Sliding Expiration │  │  - Write Services & Soft Deletes   │  │  - Pydantic Validation │  │  - Exception Hand. │ │
│  │  - Token Theft Guard  │  │  - Currency & Stock Persistence    │  │  - Copywriter Studio   │  │  - CORS & Security │ │
│  └───────────┬───────────┘  └──────────────────┬─────────────────┘  └───────────┬────────────┘  └────────────────────┘ │
└──────────────┼─────────────────────────────────┼────────────────────────────────┼──────────────────────────────────────┘
               │                                 │                                │
               ▼                                 ▼                                ▼
     ┌───────────────────┐             ┌───────────────────┐            ┌───────────────────┐
     │  PostgreSQL 17    │             │   PostgreSQL 17   │            │    Groq Cloud     │
     │  Session Hashes   │             │   Catalog Data    │            │  qwen/qwen3.8-27b │
     │  & Audit Logs     │             │   & Full Indexes  │            │ (Sub-second LLM)  │
     └───────────────────┘             └───────────────────┘            └───────────────────┘
```

---

## 🛠️ Technology Stack

| Tier | Technology | Purpose & Details |
| :--- | :--- | :--- |
| **Backend Framework** | **Django 5.1** & **Django REST Framework (DRF)** | Robust, scalable RESTful API foundation with class-based views and modular architecture. |
| **Language & Tooling** | **Python 3.12** with **`uv`** | High-performance Python tooling and ultra-fast dependency resolution. |
| **Database** | **PostgreSQL 17** *(Supabase / Managed)* | Relational storage with indexed foreign keys, array fields for tags, and check constraints. |
| **API Documentation** | **drf-spectacular (OpenAPI 3.0 / Swagger)** | Auto-generated interactive Swagger UI and schema at `/api/docs/`. |
| **Authentication** | **Dual-Token JWT + Opaque Refresh Sessions** | 10-min access tokens, SHA-256 hashed refresh tokens, multi-device management, sliding timeouts. |
| **Generative AI** | **Groq Cloud API (`qwen/qwen3.8-27b`)** | Sub-second LLM inference (~300ms) with structured JSON Schema output. |
| **Frontend Framework** | **React 19** & **Vite 8** | Modern component architecture, fast HMR, and optimized production bundle. |
| **Styling & Design** | **Tailwind CSS v4** + Custom Design Tokens | Dual Dark/Light themes, CSS variables, high contrast, non-glass readable cards. |
| **Icons & UI** | **Lucide React** + Custom Accessible Controls | OS-agnostic dropdowns, physical tactile feedback demo buttons, Bento summary cards. |
| **State & Networking** | **React Context API** + **Axios** | Centralized Auth, Toast, and Theme providers with automatic JWT refresh interceptors. |
| **Testing** | **Pytest** + **Puppeteer E2E (Chrome)** | 24 backend unit/integration tests + 29-step automated headless browser test suite. |

---

## 🧠 GenAI Features Deep-Dive

### 1. Conversational Natural Language Product Search
* **Problem**: Traditional keywords often fail when shoppers ask complex, multi-variable queries such as *"wireless noise-canceling headphones from Sony or Bose under 25000"*.
* **Our Solution**:
  1. The user inputs their conversational query in the search bar.
  2. The query is submitted to the `/api/v1/ai/search/` endpoint.
  3. Groq's `qwen/qwen3.8-27b` extracts structured criteria into a strict Pydantic schema:
     ```json
     {
       "search": "wireless noise-canceling headphones",
       "brand": "Sony",
       "category": "Audio",
       "min_price": 0.00,
       "max_price": 25000.00,
       "ordering": "-price"
     }
     ```
  4. The backend applies these validated filters directly to the PostgreSQL database.
  5. The UI displays an **AI Query Interpretation Card** with interactive badges for Brand, Category, Price Range, and a clearly explained `"Sort: Best Match"` indicator.
* **Zero-Hallucination Guarantee**: The LLM *never* generates products. It only parses query intent, preventing hallucinated prices, ghost items, or incorrect stock.

### 2. AI Copywriter Studio
* **Problem**: Catalog managers struggle to write engaging, tone-tailored product descriptions and relevant SEO tags for each SKU.
* **Our Solution**:
  1. Built directly into the **Product Form Modal**.
  2. The catalog admin inputs a product title, selects Brand & Category, and pastes rough bullet points (e.g., *"40hr battery, ANC, ultra-lightweight"*).
  3. The admin chooses a brand voice tone: **Professional**, **Friendly**, **Technical**, **Energetic**, **Minimalist**, or **Luxury**.
  4. The Groq LLM generates an evocative marketing copy and extracts 3–8 relevant SEO hashtags that automatically populate into the form for one-click publishing.

---

## 🔑 Demo Credentials

The platform includes pre-configured demo accounts and **tactile 1-click fill buttons** on the Login page:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | `admin@catalogiq.com` | `AdminPass123!` | Full CRUD rights, AI Studio, session revocation |
| 👤 **Standard User** | `user@catalogiq.com` | `UserPass123!` | Public catalog browsing, AI search, own-item edit |

---

## 📡 Core API Endpoints

### 🔐 Authentication (`/api/v1/auth/`)
* `POST /login/`: Authenticates credentials, creates a device session, returns access and refresh tokens.
* `POST /register/`: Registers a new user account.
* `POST /refresh/`: Rotates refresh token, detects reuse/theft, issues new token pair.
* `POST /logout/`: Revokes the current session and blacklists the refresh token.
* `POST /logout-all/`: Revokes all active sessions across all devices for the authenticated user.
* `GET /me/`: Returns current authenticated user profile.
* `GET /sessions/`: Lists active devices/sessions with IP, user-agent, creation, and last activity timestamps.
* `DELETE /sessions/{id}/`: Revokes a specific remote session.

### 📦 Catalog Management (`/api/v1/catalog/` or `/api/v1/`)
* `GET /products/`: Paginated product catalog with multi-attribute filtering (`search`, `brand`, `category`, `min_price`, `max_price`, `is_active`, `ordering`).
* `GET /products/{id}/`: Retrieves full product details.
* `POST /products/`: Creates a new product with stock and tags *(Requires authentication)*.
* `PATCH /products/{id}/`: Updates an existing product *(Requires Admin or creator ownership)*.
* `DELETE /products/{id}/`: Soft-deletes a product (`is_active = False`).
* `GET /brands/`: Lists available brands.
* `POST /brands/`: Creates a new brand inline *(Requires Admin)*.
* `GET /categories/`: Lists available categories.
* `POST /categories/`: Creates a new category inline *(Requires Admin)*.

### 🤖 GenAI Superpowers (`/api/v1/ai/`)
* `POST /search/`: Interprets natural language queries into structured database filters.
* `POST /product-description/`: Generates marketing descriptions and SEO tags using Groq Qwen 27B.

### 📚 Documentation & Health
* `GET /api/docs/`: Interactive Swagger UI.
* `GET /api/schema/`: OpenAPI 3.0 YAML/JSON specification.
* `GET /api/health/`: Service and database health check.

---

## 💻 Local Setup Instructions

### Prerequisites
* **Python 3.12+** and [`uv`](https://github.com/astral-sh/uv) (or `pip`)
* **Node.js 20+** and `npm`
* A **PostgreSQL** database (Local PostgreSQL or a cloud instance like Supabase / Neon)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Vishwajitp18/CatalogIQ.git
cd CatalogIQ
```

---

### 2. Backend Setup (Django & DRF)

```bash
cd backend

# Option A: Using uv (Recommended for speed)
uv sync

# Option B: Using standard Python venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # or install via uv pip install -e .

# Configure environment variables
cp .env.example .env
# Edit .env and supply your DATABASE_URL, DJANGO_SECRET_KEY, and GROQ_API_KEY

# Run database migrations
.venv/bin/python manage.py migrate

# Seed database with realistic brands, categories, and products
.venv/bin/python manage.py seed_demo

# Start the Django development server
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

* Backend server will start at: `http://localhost:8000`
* Interactive API Documentation: `http://localhost:8000/api/docs/`

---

### 3. Frontend Setup (React & Vite)

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Ensure VITE_API_BASE_URL=http://localhost:8000/api/v1

# Start the development server
npm run dev
```

* Frontend application will open at: `http://localhost:5173`

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DJANGO_SETTINGS_MODULE` | Active Django settings module | `config.settings.local` |
| `DJANGO_SECRET_KEY` | Cryptographic signing key | `secure-random-secret-key-32-chars-min` |
| `DJANGO_DEBUG` | Enable debug mode (`True` for local, `False` for prod) | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `localhost,127.0.0.1,.onrender.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173,https://your-app.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF protection | `http://localhost:5173,https://your-app.vercel.app` |
| `GROQ_API_KEY` | API Key for Groq Cloud GenAI | `gsk_...` |
| `GROQ_MODEL` | Groq LLM model name | `qwen/qwen3.8-27b` |
| `ACCESS_TOKEN_MINUTES` | Lifetime of signed JWT access token | `10` |
| `REFRESH_TOKEN_DAYS` | Sliding expiration duration for refresh session | `14` |
| `SESSION_ABSOLUTE_DAYS` | Maximum hard ceiling for any session | `30` |
| `CATALOG_CURRENCY` | Default catalog display currency | `INR` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL pointing to Django API v1 | `http://localhost:8000/api/v1` or `https://api.yourdomain.com/api/v1` |

---

## 🚢 Deployment Details

### Backend Deployment (e.g. Render / Railway / Cloud Run)
1. **Build Command**:
   ```bash
   pip install uv && uv sync --frozen && uv run python manage.py collectstatic --noinput && uv run python manage.py migrate
   ```
2. **Start Command**:
   ```bash
   uv run gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 60
   ```
3. Set environment variables (`DJANGO_SETTINGS_MODULE=config.settings.production`, `DJANGO_DEBUG=False`, `DATABASE_URL`, `GROQ_API_KEY`, `CORS_ALLOWED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`).

### Frontend Deployment (e.g. Vercel / Netlify)
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variable**: `VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`
5. **SPA Rewrites**: Add single-page application route rewrite rule (`/* -> /index.html`) so client-side routing works on refresh.

---

## 🏛️ Key Design Decisions

1. **Hybrid Deterministic AI Architecture**:
   Instead of using vector databases that suffer from embedding staleness or pure LLM response generation that invents product pricing, we leverage the LLM as an **intelligent semantic parser** and the PostgreSQL database as the **deterministic source of truth**.
2. **Enterprise Session Management & Token Rotation**:
   Rather than standard stateless refresh tokens that cannot be revoked upon device theft, refresh tokens are generated as high-entropy cryptographically secure tokens whose SHA-256 hashes are stored in the database. When refreshed, the old token is revoked and a 10-second reuse grace window allows network recovery without triggering false theft alarms.
3. **Unified Dual Dark/Light Theme System**:
   Implemented using pure semantic CSS variables (`--surface`, `--surface-panel`, `--text`, `--accent`, `--border`) without relying on simplistic color inversion. High contrast is preserved across every component for WCAG 2.2 AA accessibility.
4. **Resilient Error Parsing**:
   Centralized frontend error translation (`errorParser.js`) that automatically extracts structured Django REST Framework errors into human-friendly messages and displays non-intrusive toast notifications.

---

## 🧪 Testing & Verification

### 1. Backend Automated Tests (Pytest)
```bash
cd backend
.venv/bin/pytest
```
* **Coverage**: 24 comprehensive unit and integration tests verifying user registration, login, token rotation, product CRUD permissions, search filtering, and GenAI schema validations.

### 2. Website End-to-End Browser Tests (Puppeteer)
```bash
cd frontend
node test-e2e.mjs
```
* **Coverage**: 29 end-to-end browser tests run via headless Google Chrome simulating real user behavior:
  * Route protection & redirect banners (`/sessions` $\rightarrow$ `/login`)
  * Tactile feedback on demo role pills
  * Successful authentication & return-URL navigation
  * Bento catalog stats rendering & Table/Grid view switches
  * Product Detail Modal opening and closing
  * Groq Qwen AI natural language search with `"Sort: Best Match"` labeling
  * Product creation with Brand/Category dropdowns and stock persistence
  * Instant Dark $\leftrightarrow$ Light theme toggling
  * Remote device session sign-out and route re-protection
