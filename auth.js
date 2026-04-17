const API_BASE = "/api";
const USER_TOKEN_KEY = "bookstoreUserToken";
const USER_PROFILE_KEY = "bookstoreUserProfile";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const authMessage = document.getElementById("authMessage");

function setMessage(text) {
  authMessage.textContent = text;
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

function saveSession(token, user) {
  localStorage.setItem(USER_TOKEN_KEY, token);
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value
      })
    });

    saveSession(response.token, response.user);
    setMessage(`Account created. Welcome, ${response.user.name}. Redirecting...`);
    registerForm.reset();
    window.location.href = "index.html";
  } catch (error) {
    setMessage(error.message);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value
      })
    });

    saveSession(response.token, response.user);
    setMessage(`Welcome back, ${response.user.name}. Redirecting...`);
    loginForm.reset();
    window.location.href = "index.html";
  } catch (error) {
    setMessage(error.message);
  }
});