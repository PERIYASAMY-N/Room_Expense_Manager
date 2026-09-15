# Room Expense Manager

A full-stack application built with React, Node.js, Express, and MySQL to manage personal expenses and shared room expenses.

## Features

*   **Unified Account:** One account to manage your personal finances and join multiple shared rooms.
*   **Personal Management:** Track your own income and expenses securely. Data is completely isolated from any shared rooms.
*   **Room Management:** Create rooms, invite roommates via invite codes, and track shared expenses.
*   **Settlement Engine:** Automatically calculates "Who Pays Whom" to minimize the number of transactions required to settle up.
*   **Secure & Isolated:** JWT authentication with robust backend validation ensures users can only access data for rooms they are a member of.

## Technology Stack

*   **Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios, Recharts
*   **Backend:** Node.js, Express.js, JWT, bcrypt
*   **Database:** MySQL

## Local Setup

### 1. Database

Make sure you have MySQL installed and running. Execute `schema.sql` to create the required database and tables:

```bash
cd backend
mysql -u yourusername -p < schema.sql
```

### 2. Backend

```bash
cd backend
npm install
# Create a .env file (see .env.example)
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
# Create a .env file with VITE_API_URL=http://localhost:5000/api
npm run dev
```

## Environment Variables

### Backend (`.env`)

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=room_expense_manager
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## Deployment

The application is structured for easy deployment on platforms like Railway (Backend + MySQL) and Vercel (Frontend).

1.  **Database:** Provision a MySQL database (e.g., on Railway) and run `schema.sql`.
2.  **Backend:** Deploy the `backend` folder. Set the environment variables provided by your database host and set `FRONTEND_URL` to your Vercel URL. Railway will automatically use the `npm start` command.
3.  **Frontend:** Deploy the `frontend` folder to Vercel. Set `VITE_API_URL` to your backend's deployed URL. The build command is `npm run build` and output directory is `dist`.

## Architecture

The system enforces strict separation between personal expenses and room expenses:
*   `personal_expenses` table links directly to a `user_id`.
*   `room_expenses` links to a `room_id`.
*   Users must join a room (creating a record in the `members` table) to view or add expenses for that room. Backend middleware enforces this check on every request.
