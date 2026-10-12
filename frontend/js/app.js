// API Base URL
const API_URL = "http://localhost:3000/api/expenses";

// State
let allExpenses = [];

// DOM Elements
const loadingSpinner = document.getElementById("loadingSpinner");
const alertContainer = document.getElementById("alertContainer");
const expensesTableBody = document.getElementById("expensesTableBody");
const emptyState = document.getElementById("emptyState");
const tableContainer = document.getElementById("tableContainer");

const totalAmountEl = document.getElementById("totalAmount");
const totalCountEl = document.getElementById("totalCount");
const highestExpenseEl = document.getElementById("highestExpense");

const addExpenseForm = document.getElementById("addExpenseForm");
const editExpenseForm = document.getElementById("editExpenseForm");
const editExpenseModalEl = document.getElementById("editExpenseModal");
const editModal = editExpenseModalEl ? new bootstrap.Modal(editExpenseModalEl) : null;

// Filter Elements
const filterCategorySelect = document.getElementById("filterCategory");
const searchTitleInput = document.getElementById("searchTitle");
const filterDateInput = document.getElementById("filterDate");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const tableFilterCountBadge = document.getElementById("tableFilterCountBadge");

// ==========================================
// Helper functions (spinner & alert)
// ==========================================

function showSpinner(show) {
  if (!loadingSpinner) return;
  if (show) {
    loadingSpinner.classList.remove("d-none");
  } else {
    loadingSpinner.classList.add("d-none");
  }
}

function showAlert(message, type = "danger") {
  if (!alertContainer) return;
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function setDateConstraints() {
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = [
    document.getElementById("expenseDate"),
    document.getElementById("editExpenseDate"),
    filterDateInput
  ];
  dateInputs.forEach(input => {
    if (input) {
      input.max = today;
      if (input.id === "expenseDate" && !input.value) {
        input.value = today;
      }
    }
  });
}

// ==========================================
// Core API Functions
// ==========================================

async function getExpenses() {
  try {
    showSpinner(true);
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return await res.json();
  } catch (err) {
    showAlert(err.message);
    return [];
  } finally {
    showSpinner(false);
  }
}

async function addExpense(data) {
  try {
    showSpinner(true);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to add expense");
    await refresh();
  } catch (err) {
    showAlert(err.message);
  } finally {
    showSpinner(false);
  }
}

async function updateExpense(id, data) {
  try {
    showSpinner(true);
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update expense");
    await refresh();
  } catch (err) {
    showAlert(err.message);
  } finally {
    showSpinner(false);
  }
}

async function deleteExpense(id) {
  try {
    showSpinner(true);
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete expense");
    await refresh();
  } catch (err) {
    showAlert(err.message);
  } finally {
    showSpinner(false);
  }
}

// ==========================================
// Render & Filter Functions
// ==========================================

async function refresh() {
  allExpenses = await getExpenses();
  renderSummary(allExpenses);
  applyFilter();
}

function renderSummary(list) {
  // Using Array.reduce to compute summary metrics
  const summary = list.reduce(
    (acc, item) => {
      const amount = parseFloat(item.amount) || 0;
      acc.total += amount;
      acc.count += 1;
      if (amount > acc.highest) acc.highest = amount;
      return acc;
    },
    { total: 0, count: 0, highest: 0 }
  );

  totalAmountEl.textContent = `$${summary.total.toFixed(2)}`;
  totalCountEl.textContent = summary.count;
  highestExpenseEl.textContent = `$${summary.highest.toFixed(2)}`;
}

function renderTable(list) {
  expensesTableBody.innerHTML = "";

  if (!list || list.length === 0) {
    tableContainer.classList.add("d-none");
    emptyState.classList.remove("d-none");
    return;
  }

  tableContainer.classList.remove("d-none");
  emptyState.classList.add("d-none");

  list.forEach(expense => {
    const tr = document.createElement("tr");
    const categoryClass = (expense.category || "other").toLowerCase();

    tr.innerHTML = `
      <td class="ps-3 fw-medium text-dark">${expense.title}</td>
      <td class="expense-amount-cell">$${parseFloat(expense.amount).toFixed(2)}</td>
      <td><span class="badge badge-category badge-${categoryClass}">${expense.category}</span></td>
      <td class="text-muted small">${expense.date}</td>
      <td class="text-end pe-3">
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-primary btn-edit" data-id="${expense.id}" title="Edit">
            <i class="bi bi-pencil" data-id="${expense.id}"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-delete" data-id="${expense.id}" title="Delete">
            <i class="bi bi-trash" data-id="${expense.id}"></i>
          </button>
        </div>
      </td>
    `;
    expensesTableBody.appendChild(tr);
  });
}

function applyFilter() {
  // Use a temporary array for filtering
  let tempExpenses = [...allExpenses];

  const category = filterCategorySelect.value;
  if (category && category !== "All") {
    tempExpenses = tempExpenses.filter(item => item.category === category);
  }

  if (searchTitleInput && searchTitleInput.value.trim()) {
    const query = searchTitleInput.value.trim().toLowerCase();
    tempExpenses = tempExpenses.filter(item => (item.title || "").toLowerCase().includes(query));
  }

  if (filterDateInput && filterDateInput.value) {
    tempExpenses = tempExpenses.filter(item => item.date === filterDateInput.value);
  }

  if (tableFilterCountBadge) {
    const isFiltered = category !== "All" || (searchTitleInput && searchTitleInput.value.trim()) || (filterDateInput && filterDateInput.value);
    tableFilterCountBadge.textContent = isFiltered
      ? `Showing ${tempExpenses.length} of ${allExpenses.length} expenses`
      : `Showing all ${allExpenses.length} expenses`;
  }

  renderTable(tempExpenses);
}

// ==========================================
// Event Listeners & Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setDateConstraints();
  refresh();

  // Prevent default page reload on Add Expense form submit
  addExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("expenseTitle").value.trim();
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const date = document.getElementById("expenseDate").value;

    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
      showAlert("Please fill in all required fields properly.");
      return;
    }

    await addExpense({ title, amount, category, date });
    addExpenseForm.reset();
    setDateConstraints();
  });

  // Edit Expense form submit
  editExpenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editExpenseId").value;
    const title = document.getElementById("editExpenseTitle").value.trim();
    const amount = parseFloat(document.getElementById("editExpenseAmount").value);
    const category = document.getElementById("editExpenseCategory").value;
    const date = document.getElementById("editExpenseDate").value;

    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
      showAlert("Please fill in all required fields properly.");
      return;
    }

    await updateExpense(id, { title, amount, category, date });
    if (editModal) editModal.hide();
  });

  // Click event on table for Update & Delete using data-id
  expensesTableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");

    if (editBtn) {
      const id = editBtn.dataset.id;
      const expense = allExpenses.find(item => String(item.id) === String(id));
      if (!expense) return;

      document.getElementById("editExpenseId").value = expense.id;
      document.getElementById("editExpenseTitle").value = expense.title;
      document.getElementById("editExpenseAmount").value = expense.amount;
      document.getElementById("editExpenseCategory").value = expense.category;
      document.getElementById("editExpenseDate").value = expense.date;

      if (editModal) editModal.show();

    }
    else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      // Confirmation message using browser alert/confirm
      const confirmed = window.confirm("Are you sure you want to delete this expense?");
      if (confirmed) {
        deleteExpense(id);
      }
    }
  });

  // Filters event listeners
  filterCategorySelect.addEventListener("change", applyFilter);
  if (searchTitleInput) searchTitleInput.addEventListener("input", applyFilter);
  if (filterDateInput) filterDateInput.addEventListener("input", applyFilter);

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      filterCategorySelect.value = "All";
      if (searchTitleInput) searchTitleInput.value = "";
      if (filterDateInput) filterDateInput.value = "";
      applyFilter();
    });
  }
});
