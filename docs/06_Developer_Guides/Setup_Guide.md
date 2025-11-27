# Setup Guide for Flowlet

This guide provides instructions on how to set up the Flowlet development environment, including both the backend and web-frontend components.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3.8+:** For the Flask backend.
- **Node.js 14+ & npm/yarn:** For the React web-frontend applications.
- **Git:** For cloning the repository.

## 1. Clone the Repository

First, clone the Flowlet repository to your local machine:

```bash
git clone https://github.com/abrar2030/Flowlet
cd Flowlet
```

## 2. Backend Setup (Python Flask)

Navigate to the `backend` directory and set up the Python environment.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
```

### Running the Backend

Once the dependencies are installed, you can run the Flask backend:

```bash
python src/main.py
```

The backend server will typically run on `http://127.0.0.1:5000`.

## 3. web-frontend Setup (React)

Flowlet includes two web-frontend applications: `web-web-frontend` and `mobile-web-frontend`. You need to set up each one separately.

### Web web-frontend

Navigate to the `web-frontend/web-web-frontend` directory and install the Node.js dependencies.

```bash
cd ../web-frontend/web-web-frontend
npm install  # or yarn install
```

### Running the Web web-frontend

To start the web web-frontend development server:

```bash
npm start  # or yarn start
```

The web web-frontend will typically run on `http://localhost:3000`.

### Mobile web-frontend

Navigate to the `web-frontend/mobile-web-frontend` directory and install the Node.js dependencies.

```bash
cd ../mobile-web-frontend
npm install  # or yarn install
```

### Running the Mobile web-frontend

To start the mobile web-frontend development server:

```bash
npm start  # or yarn start
```

The mobile web-frontend will typically run on `http://localhost:19006` (Expo default).

## 4. Database Setup

Flowlet uses SQLite by default, and the database file (`flowlet.db`) will be created automatically when the Flask backend is run for the first time. You can find it in `backend/src/database/`.

If you wish to use a different database, you will need to modify the `SQLALCHEMY_DATABASE_URI` in `backend/src/main.py` and install the appropriate database connector library (e.g., `psycopg2` for PostgreSQL, `mysqlclient` for MySQL).

## 5. Running Tests

### Backend Tests

To run the backend tests, navigate to the `backend` directory and execute the `pytest` command (you might need to install `pytest` first: `pip install pytest`).

```bash
cd backend
pytest
```

### web-frontend Tests

web-frontend tests are typically run using `npm test` or `yarn test` within their respective directories.

```bash
cd web-frontend/web-web-frontend
npm test

cd ../mobile-web-frontend
npm test
```

## Troubleshooting

- **Port Conflicts:** If you encounter
