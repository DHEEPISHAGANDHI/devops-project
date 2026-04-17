const API_BASE = "/api";
const USER_TOKEN_KEY = "bookstoreUserToken";
const USER_PROFILE_KEY = "bookstoreUserProfile";

let books = [];
let cart = { items: [], total: 0 };
let userToken = localStorage.getItem(USER_TOKEN_KEY) || "";
let userProfile = null;

try {
  const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
  userProfile = savedProfile ? JSON.parse(savedProfile) : null;
} catch (error) {
  userProfile = null;
}

const bookGrid = document.getElementById("bookGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function setAuthState(isLoggedIn, text) {
  logoutBtn.hidden = !isLoggedIn;
  authStatus.textContent = text;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);
  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      data = { message: "Server returned a non-JSON response" };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function loadBooks() {
  books = await apiRequest("/books");
  renderBooks(searchInput.value);
}

async function loadCart() {
  if (!userToken) {
    cart = { items: [], total: 0 };
    renderCart();
    return;
  }

  cart = await apiRequest("/cart", {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  });
  renderCart();
}

function renderBooks(filterText = "") {
  const normalized = filterText.trim().toLowerCase();
  const filtered = books.filter((book) => {
    return (
      book.title.toLowerCase().includes(normalized) ||
      book.author.toLowerCase().includes(normalized)
    );
  });

  bookGrid.innerHTML = "";

  filtered.forEach((book, index) => {
    const card = document.createElement("article");
    card.className = "book-card";
    card.style.animationDelay = `${index * 70}ms`;
    card.innerHTML = `
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">by ${book.author}</p>
      <p class="book-description">${book.description || "No description provided."}</p>
      <div class="book-meta">
        <span class="price">${formatMoney(book.price)}</span>
        <button data-id="${book._id}">Add</button>
      </div>
    `;
    bookGrid.appendChild(card);
  });

  emptyState.hidden = filtered.length !== 0;
}

function renderCart() {
  cartItems.innerHTML = "";

  if (!cart.items || cart.items.length === 0) {
    const row = document.createElement("li");
    row.textContent = "Your cart is empty.";
    cartItems.appendChild(row);
    cartTotal.textContent = "Total: $0.00";
    return;
  }

  cart.items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "cart-item";
    row.innerHTML = `<span>${item.title} x ${item.quantity}</span><span>${formatMoney(item.price * item.quantity)}</span>`;
    cartItems.appendChild(row);
  });

  cartTotal.textContent = `Total: ${formatMoney(cart.total || 0)}`;
}

bookGrid.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const bookId = target.dataset.id;
  if (!bookId) {
    return;
  }

  if (!userToken) {
    setAuthState(false, "Please login as user to add books to your cart.");
    return;
  }

  try {
    cart = await apiRequest("/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ bookId, quantity: 1 })
    });
    renderCart();
    setAuthState(true, `${userProfile ? userProfile.name : "User"}, book added to your cart.`);
  } catch (error) {
    setAuthState(Boolean(userToken), error.message);
  }
});

searchInput.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    renderBooks(target.value);
  }
});

logoutBtn.addEventListener("click", () => {
  userToken = "";
  userProfile = null;
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  cart = { items: [], total: 0 };
  renderCart();
  setAuthState(false, "You are logged out. Login to use cart.");
});

async function bootstrap() {
  if (userToken) {
    try {
      const profileResponse = await apiRequest("/auth/me", {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      userProfile = profileResponse.user;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      setAuthState(true, `Session restored for ${userProfile.name}.`);
    } catch (error) {
      userToken = "";
      userProfile = null;
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
      setAuthState(false, "Session expired. Please login again.");
    }
  } else {
    setAuthState(false, "Sign up or login to add books to your cart.");
  }

  await loadBooks();
  await loadCart();
}

bootstrap().catch((error) => {
  authStatus.textContent = `Unable to load app: ${error.message}. Start backend and MongoDB.`;
});