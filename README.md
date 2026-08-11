# API Collection Manager

An advanced, self-hosted API workspace and collection management tool that enables developers to import, manage, and execute API endpoints through a seamless web interface.

## Platform Features

- **Collection Hub:** Drag and drop support for popular API collection schemas (Bruno/Legacy templates).
- **Environment Contexts:** Define global and local environment variables for dynamic payload injection (`{{variable}}` syntax).
- **Multi-Format Payloads:** Deep native support for `form-data`, `x-www-form-urlencoded`, and raw data payloads with base64 file encapsulation.
- **Interactive Inspector:** Built-in recursive JSON node viewer for deep response packet analysis, complete with syntax highlighting and raw/preview rendering modes.
- **Sandbox Engine:** Integrated JavaScript runtime to execute pre-request and post-response automated scripts asynchronously within the browser boundary.
- **Containerized Architecture:** Zero-setup, isolated execution stack encapsulated via Docker Compose.

---

## Technical Stack

| Layer | Technology |
| --- | --- |
| **Backend API** | Flask (Python), SQLAlchemy, psycopg2 |
| **Frontend UI** | React (Vite), Axios, React Router |
| **Datastore** | PostgreSQL 15 |
| **Authentication** | JWT (JSON Web Tokens) |
| **Deployment** | Docker & Docker Compose, NGINX |

---

## Quickstart (Recommended)

The entire application stack (Frontend, Backend, and Database) is orchestrated via a single Docker manifest.

### Requirements

- Docker Engine
- Docker Compose

### Boot Sequence

Clone the repository and start the cluster:

```bash
git clone https://github.com/halilibrahim04/api-collection-manager.git
cd api-collection-manager

docker-compose up -d --build
```

The system will automatically coordinate the boot stages:

1. Provisions the PostgreSQL datastore.
2. Initializes the Python Flask backend and automatically executes the DDL scheme migrations.
3. Compiles the React UI and wraps it over an NGINX proxy.

You can now access the application at **[http://localhost](http://localhost)**.

---

## Manual Installation (Local Development)

If you prefer to run the components independently on bare metal:

### 1. Database

By default, the backend automatically provisions a zero-config **SQLite** database (`instance/app.db`).
*Optional:* To connect to a local PostgreSQL instance, define the connection string in `backend/.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/api_manager
```

### 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate    # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

flask db upgrade
python run.py
```

*Listens by default on `http://localhost:5000`*

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

*Listens by default on `http://localhost:5173`*

---

## Architecture Endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Identity provisioning |
| `POST` | `/api/auth/login` | Session token generation |
| `GET` | `/api/collections` | Fetch root collection trees |
| `POST` | `/api/collections/import` | Ingest external collection files |
| `GET` | `/api/environments` | Fetch environment variable configurations |
| `PUT` | `/api/endpoints/<id>` | Update endpoint properties |
| `POST` | `/api/proxy` | Execute arbitrary network requests |

---

*Academic Build Version v1.0.0*
