// Expense Tracker - backend (Express API + PostgreSQL)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
//const { Pool } = require("pg");

const pg = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed categories per database schema and project roadmap
const ALLOWED_CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Other"];

// PostgreSQL connection pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "expense_tracker",
});

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates expense payload fields.
 * Returns an error message string if invalid, or null if valid.
 */
function validateExpenseData({ title, amount, category, date }) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    return "Title is required and must not be empty.";
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return "Amount must be a number greater than 0.";
  }

  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`;
  }

  if (!date || typeof date !== "string") {
    return "Date is required.";
  }

  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
    return "Date must be a valid date in YYYY-MM-DD format.";
  }

  return null;
}

/**
 * Validates integer ID parameter.
 * Returns the parsed integer ID or null if invalid.
 */
function parseValidId(idParam) {
  const parsed = parseInt(idParam, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(idParam)) {
    return null;
  }
  return parsed;
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * GET /api/expenses
 * Returns all expenses from the database.
 */
app.get("/api/expenses", async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      ORDER BY date DESC, id DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal server error while fetching expenses." });
  }
});

/**
 * GET /api/expenses/:id
 * Returns one expense by ID (404 if not found).
 */
app.get("/api/expenses/:id", async (req, res) => {
  const id = parseValidId(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: "Expense not found." });
  }

  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: "Internal server error while fetching expense." });
  }
});

/**
 * POST /api/expenses
 * Adds a new expense (201, or 400 if validation fails).
 */
app.post("/api/expenses", async (req, res) => {
  const validationError = validateExpenseData(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { title, amount, category, date } = req.body;

  try {
    const query = `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(query, [title.trim(), parseFloat(amount), category, date]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal server error while creating expense." });
  }
});

/**
 * PUT /api/expenses/:id
 * Updates an expense (200, 400 if invalid body, 404 if not found).
 */
app.put("/api/expenses/:id", async (req, res) => {
  const id = parseValidId(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: "Expense not found." });
  }

  const validationError = validateExpenseData(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const { title, amount, category, date } = req.body;

  try {
    const query = `
      UPDATE expenses
      SET 
        title = $1, 
        amount = $2, 
        category = $3, 
        date = $4
      WHERE id = $5
      RETURNING 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
    `;
    const result = await pool.query(query, [title.trim(), parseFloat(amount), category, date, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Internal server error while updating expense." });
  }
});

/**
 * DELETE /api/expenses/:id
 * Deletes an expense (200, or 404 if not found).
 */
app.delete("/api/expenses/:id", async (req, res) => {
  const id = parseValidId(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: "Expense not found." });
  }

  try {
    const query = `
      DELETE FROM expenses
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.status(200).json({ message: "Expense deleted successfully.", id });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal server error while deleting expense." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Expense Tracker API listening on http://localhost:${PORT}`);
});
