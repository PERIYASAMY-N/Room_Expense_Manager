# Room Expense Manager

A robust, multi-tenant expense sharing application designed for shared living arrangements. The app allows roommates to log shared expenses, distribute them fairly (or unequally), record settlements, and uses an algorithm to determine the optimal way to settle debts. 

## Key Features
- **Strict Multi-Room Architecture**: Users can create isolated rooms. A user's JWT strictly binds them to a single room. Users from Room A can never read or modify data from Room B.
- **Role-Based Access Control (RBAC)**: Only the `ADMIN` (the room creator) can access the Members page, add new members via API, or modify existing ones.
- **Dynamic Expense Splitting**: Add multiple items to a single expense, specify who paid, and who the participants are. The system automatically splits the total equally among the selected participants.
- **Exact Decimal Math**: Uses precise distribution strategies to avoid the `99.99` rounding problem (e.g. `100 / 3 = 33.34, 33.33, 33.33`).
- **Algorithm Recommendations**: The Settlement Recommendation engine calculates net balances for all members, separates creditors and debtors, and recommends minimum transactions to zero out all balances.
- **Tabbed Dashboard**: Separate `My Summary` (individual contributions) from `Room Summary` (global room statistics).

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router DOM, Axios, Lucide React
- **Backend**: Node.js, Express, mysql2, JWT, bcrypt
- **Database**: MySQL

## Prerequisites
- Node.js (v16 or higher)
- MySQL Server

## Setup and Installation

### 1. Database Configuration
Ensure MySQL is running, then configure your environment variables:
```bash
cd backend
# Create a .env file (or modify the existing one)
echo "DB_HOST=127.0.0.1" > .env
echo "DB_USER=root" >> .env
echo "DB_PASSWORD=root" >> .env
echo "JWT_SECRET=super_secret_jwt_key_12345" >> .env
echo "PORT=5000" >> .env
```

### 2. Backend Initialization
Install dependencies, initialize the database schema, and seed demo data:
```bash
cd backend
npm install
node seed.js
npm run dev
```
*The `seed.js` script will execute `schema.sql` (creating the `room_expense_manager` database) and insert deterministic mock data.*

### 3. Frontend Initialization
Install frontend dependencies and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## Demo Credentials

The `seed.js` script creates two distinct rooms:

### Room A (VSB Boys Room)
**Room ID**: `RM7K4P2X`

#### Admin Login:
- **Username**: `naveen`
- **Password**: `Naveen@123`

#### Member Logins:
- **Username**: `kadhir` | **Password**: `Kadhir@123`
- **Username**: `navi` | **Password**: `Navi@123`
- **Username**: `karthik` | **Password**: `Karthik@123`

*(Note: Passwords are fully hashed with bcrypt in the database. Plain text passwords are NEVER stored.)*

### Room B (Secret Isolation Test Room)
**Room ID**: `RMTEST99`
- **Username**: `testuser`
- **Password**: `Test@123`

## Calculation Logic
1. **Total Paid**: How much a member has paid for expenses directly.
2. **Total Share**: How much of the total expenses legally belongs to a member.
3. **Total Given / Received**: Manual settlements logged outside of expenses.
4. **Net Balance**: `(Total Paid - Total Share) + Total Received - Total Given`

If `Net Balance > 0`, the member *Gets Back* money. If `< 0`, they *Need to Pay*.
