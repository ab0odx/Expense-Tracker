# Expense Tracker

- **GitHub Repository:** 
https://github.com/ab0odx/Expense-Tracker

- **Live Demo:** 
https://drive.google.com/file/d/1BEofJXKtoYEvfeVcKEELQeLTHAq60718/view?usp=drive_link

Expense Tracker is a full-stack personal finance web application that allows users to record, categorize, and monitor their daily spending. It features real-time summary calculations and persistent storage powered by Node.js, Express, and PostgreSQL.

## How to run

Follow the steps below to run the project locally. Make sure you have **Node.js**, **PostgreSQL**, and a code editor like **VS Code** installed.

### Backend

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create the PostgreSQL database:**
   Open your terminal and launch `psql` (PostgreSQL CLI):
   ```bash
   psql -U postgres
   ```
   Create the database and exit:
   ```sql
   CREATE DATABASE expense_tracker;
   \q
   ```

4. **Run the schema script:**
   Initialize the `expenses` table and insert initial sample data:
   ```bash
   psql -U postgres -d expense_tracker -f schema.sql
   ```

5. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in VS Code and fill in your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=expense_tracker
   PORT=3000
   ```

6. **Start the backend server:**
   ```bash
   npm start
   ```
   The backend API will run at `http://localhost:3000`.

---

### Frontend

1. Open the project folder in **VS Code**.
2. Navigate to the `frontend/` directory.
3. Open `frontend/index.html` using one of the following methods:
   - **VS Code Live Server (Recommended):** Right-click `index.html` and select **Open with Live Server**.
   - **Directly in Browser:** Double-click `index.html` or drag and drop it into any modern web browser.
4. Ensure the backend server is running so the frontend can communicate with `http://localhost:3000/api/expenses`.

---

## Features

- [x] Add an expense (with validation: non-empty title, positive amount, valid category, and date)
- [x] Delete an expense (with confirmation dialog)
- [x] Edit an expense (via a pre-filled Bootstrap modal dialog)
- [x] Filter by category (Food, Transport, Bills, Entertainment, Other, or All)
- [x] Search & date filtering (filter expenses by title search keyword or specific date)
- [x] Summary cards (real-time calculation of Total Amount, Total Count, and Highest Expense)
- [x] Data is saved in a PostgreSQL database
- [x] RESTful API built with Express and `pg` connection pooling
- [x] Responsive UI built with Bootstrap 5 and custom CSS Grid

---

## What was the hardest part?

One of the hardest parts of this project was learning how to work with APIs and using Express.js for the first time. I had to learn how the frontend communicates with the backend, how to handle requests and responses, and how to connect everything to the database. It took some time to understand how everything works together, but it helped me gain a better understanding of backend development.
