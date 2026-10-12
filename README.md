# ⚡ CatalogIQ — AI-Powered Product Intelligence & Search Engine

> A full-stack E-Commerce Product Management and Intelligent Search Platform combining **Django 5.1 REST Framework**, **Supabase PostgreSQL 17**, **Groq Cloud (Qwen 2.5 27B)**, and a **React 19 + Tailwind CSS** frontend styled with an **Apple Pro / Neo-Bento Luxe** dark aesthetic.

---

## 🌟 Highlights

- 🧠 **Natural Language AI Search**: Conversational semantic search powered by Groq (`qwen/qwen3.8-27b`). The LLM extracts structured intent (brand, category, price range, keywords) and hands off retrieval to high-performance Django ORM queries with zero hallucination.
- ✍️ **AI Copywriter Studio**: Generates high-converting marketing descriptions and SEO tags from rough feature bullets with configurable tone (Professional, Energetic, Minimalist, Luxury).
- 🛡️ **Enterprise Session Security**:
  - Stateless signed JWT access tokens (10-minute lifetime).
  - Opaque refresh tokens stored as SHA-256 hashes in Supabase PostgreSQL.
  - Automatic token rotation on refresh with a 10-second theft grace window.
  - Sliding idle expiration (14 days) and absolute max session ceiling (30 days).
  - Multi-device session manager with one-click revocation.
- 🎨 **Apple Pro / Neo-Bento Luxe UI**: Frosted glass panels (`backdrop-blur`), hairline borders, iridescent AI glow gradients, and responsive Bento grids.
- ⚡ **Zero-Docker Native Tooling**: Fast, native workflow powered by `uv` (Python 3.12) and `vite` + `npm` (Node 24).

---

## 🏗️ Architecture

```
                                      ┌──────────────────────────────────────────────┐
                                      │             React 19 + Vite UI               │
                                      │  (Apple Pro / Neo-Bento Luxe Dark Aesthetic) │
                                      └──────────────────────┬───────────────────────┘
                                                             │ REST API / Axios
                                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  Django 5.1 Backend                                                    │
│                                                                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐ │
│  │     apps.accounts     │  │            apps.catalog            │  │       apps.genai       │  │     apps.core      │ │
│  │  - Custom User        │  │  - Product, Brand, Category        │  │  - Groq Provider       │  │  - Request ID MW   │ │
│  │  - UserSession        │  │  - Selectors (read queries)        │  │  - Prompt Templates    │  │  - Access Logger   │ │
│  │  - Token Rotation     │  │  - Services (soft delete, write)   │  │  - Pydantic Schemas    │  │  - Exception Hand. │ │
│  └───────────┬───────────┘  └──────────────────┬─────────────────┘  └───────────┬────────────┘  └────────────────────┘ │
└──────────────┼─────────────────────────────────┼────────────────────────────────┼──────────────────────────────────────┘
               │                                 │                                │
               ▼                                 ▼                                ▼
     ┌───────────────────┐             ┌───────────────────┐            ┌───────────────────┐
     │  Supabase Postgres│             │ Supabase Postgres │            │    Groq Cloud     │
     │   (Port 6543)     │             │    Catalog DB     │            │  qwen/qwen3.8-27b │
     └───────────────────┘             └───────────────────┘            └───────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, Django 5.1, Django REST Framework, `uv`, `drf-spectacular`, `django-cors-headers` |
| **Database** | PostgreSQL 17 on Supabase (via transaction pooler port 6543) |
| **GenAI** | Groq Python SDK with `qwen/qwen3.8-27b`, JSON object structured outputs |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Axios, React Router 7 |
| **Testing** | Pytest, Pytest-Django, Model Bakery / Factories (24 passed unit/integration tests) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+ and [`uv`](https://github.com/astral-sh/uv)
- Node.js 20+ and `npm`

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies with uv
uv sync

# Configure environment
cp .env.example .env
# Ensure DATABASE_URL, DJANGO_SECRET_KEY, and GROQ_API_KEY are configured in .env

# Run database migrations
uv run python manage.py migrate

# Seed demo dataset (7 brands, 5 categories, 20 products, and demo user)
uv run python manage.py seed_demo

# Run development server
uv run python manage.py runserver 0.0.0.0:8000
```

Backend will be accessible at `http://localhost:8000`.
- **Interactive Swagger OpenAPI Docs**: `http://localhost:8000/api/docs/`
- **Health Check**: `http://localhost:8000/api/health/`

---

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will be accessible at `http://localhost:5173`.

---

## 🔑 Demo Credentials

A pre-seeded demo user is available for immediate testing:
- **Email**: `demo@catalogiq.com`
- **Password**: `DemoPass123!`

*(The Login page features a 1-click **"Fill Demo"** button for instant evaluation).*

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth/`)
- `POST /login/`: Issues JWT access token and opaque refresh session.
- `POST /register/`: Registers a new user.
- `POST /refresh/`: Rotates opaque refresh token with theft detection.
- `POST /logout/`: Revokes the current session.
- `POST /logout-all/`: Revokes all active sessions for the user.
- `GET /me/`: Retrieves current profile.
- `GET /sessions/`: Lists active devices/sessions.
- `DELETE /sessions/{id}/`: Revokes a specific session.

### Catalog Management (`/api/v1/catalog/`)
- `GET /products/`: Paginated catalog with multi-faceted filtering (`search`, `brand`, `category`, `min_price`, `max_price`, `is_active`, `ordering`).
- `GET /products/{id}/`: Product detail.
- `POST /products/`: Create product with SKU and tags.
- `PATCH /products/{id}/`: Update product attributes.
- `DELETE /products/{id}/`: Soft delete product (`is_active = False`).
- `GET /brands/`: List catalog brands.
- `GET /categories/`: List catalog categories.

### GenAI Superpowers (`/api/v1/ai/`)
- `POST /search/`: Interprets natural language queries (e.g., *"Nike running shoes under $150"*) into structured filters and executes ORM retrieval.
- `POST /product-description/`: Generates marketing descriptions and SEO tags from draft bullet points and chosen tone.

---

## 🧪 Testing & Code Quality

### Backend
```bash
cd backend

# Run test suite (24 tests)
uv run pytest

# Check code formatting & linting
uv run ruff check .
uv run ruff format --check .
```

### Frontend
```bash
cd frontend

# Type/linter check
npm run lint

# Production build test
npm run build
```

---

## 📄 License
MIT

