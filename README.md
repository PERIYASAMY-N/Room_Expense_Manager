# 🏠 Room Expense Manager  Live Link -> https://room-expense-manager-three.vercel.app/

A full-stack web application for managing shared room expenses and personal finances. Create or join a room, track shared expenses, calculate balances, and manage settlements — or use the application independently for personal expense tracking.

## ✨ Features

### 👥 Room Expense Management

* Create a room and become its administrator.
* Join an existing room using a Room ID and invite code.
* Manage room members dynamically.
* Add shared expenses and select participants.
* Track individual contributions and expense shares.
* Calculate who owes money and who should receive money.
* View settlement recommendations.

### 💰 Personal Expense Management

* Register and log in without joining a room.
* Manage personal expenses independently.
* Track individual spending and financial activity.
* Access a dedicated personal dashboard.

### 📊 Dashboard

* View total expenses and individual contributions.
* Clearly identify who needs to pay whom.
* Track amounts owed and amounts receivable.
* Access personal and room-based expense summaries.
* Navigate between expenses, settlements, and dashboards.

### 🔐 Authentication & Security

* JWT-based authentication.
* Password hashing using bcrypt.
* Role-based access control.
* Room-specific data isolation.
* Separate personal and shared expense management.

## 🛠️ Tech Stack

| Frontend         | Backend    | Database |
| ---------------- | ---------- | -------- |
| React.js         | Node.js    | MySQL    |
| Vite             | Express.js |          |
| JavaScript       | REST APIs  |          |
| Tailwind CSS     | JWT        |          |
| React Router DOM | bcrypt     |          |
| Axios            | dotenv     |          |

## 🔄 How It Works

### Room-Based Expense Management

1. Create a new room or join an existing room.
2. Enter the required account details.
3. Use the Room ID and invite code to access a room.
4. Add expenses and select the members who participated.
5. Track individual shares and payments.
6. View settlement recommendations to understand who needs to pay whom.

### Personal Expense Management

1. Create a personal account.
2. Log in to the application.
3. Access the personal dashboard.
4. Record and manage individual expenses.
5. Monitor personal financial activity without joining a room.

## 🧮 Expense Calculation

The application calculates each member's net balance using the difference between the amount they paid and their share of the expenses.

**Net Balance = Total Paid − Total Share**

* **Positive balance:** The member should receive money.
* **Negative balance:** The member needs to pay money.
* **Zero balance:** The member is settled.

Settlement recommendations help simplify payments between members.

## 📁 Project Structure

```text
Room-Expense-Manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   ├── schema.sql
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

* Node.js
* npm
* MySQL Server
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/PERIYASAMY-N/expense_tracker.git
cd expense_tracker
```

### 2. Set Up the Database

Create a MySQL database:

```sql
CREATE DATABASE room_expense_manager;
```

Import the project's database schema into MySQL.

### 3. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=room_expense_manager
JWT_SECRET=your_secure_secret
```

Replace the example values with your actual database credentials and configuration.

Start the backend server:

```bash
npm run dev
```

### 4. Configure the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local development URL displayed in your terminal.

## 🌐 Deployment

Planned deployment architecture:

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** Aiven MySQL

Live application URL: https://room-expense-manager-three.vercel.app/

## 🚀 Future Enhancements

* Monthly expense reports and analytics.
* Exportable expense summaries.
* Recurring expense management.
* Expense reminders and notifications.
* Enhanced settlement tracking.
* Improved mobile responsiveness.

