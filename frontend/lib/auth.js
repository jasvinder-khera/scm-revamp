// frontend/lib/auth.js
import { loginApi } from "./apiEndpoints";

const TOKEN_KEY = "token";
const CURRENT_USER_PROFILE_KEY = "currentUserProfile";
let expirationTimer;

function getTokenExpiration(token) {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const encodedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (encodedPayload.length % 4)) % 4);
    const { exp } = JSON.parse(window.atob(encodedPayload + padding));
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleTokenExpiration(token, expiration) {
  window.clearTimeout(expirationTimer);
  if (expiration === null) return;

  const delay = Math.max(expiration - Date.now(), 0);
  expirationTimer = window.setTimeout(() => {
    if (window.localStorage.getItem(TOKEN_KEY) !== token) return;
    if (Date.now() >= expiration) {
      logout();
    } else {
      scheduleTokenExpiration(token, expiration);
    }
  }, Math.min(delay, 2147483647));
}

export async function login(email, password) {
  try {
    const response = await loginApi(email, password);
    const { data, status } = response;
    if (status < 200 || status >= 300 || !data?.access_token) {
      throw new Error(data?.detail || data?.message || "Login failed");
    }
    
    setToken(data.access_token);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Invalid email or password" };
  }
}

export function logout() {
  if (typeof window === "undefined") return;

  window.clearTimeout(expirationTimer);
  window.localStorage.clear();
  window.location.href = "/login";
}

export function getToken() {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const expiration = getTokenExpiration(token);
    if (expiration !== null && expiration <= Date.now()) {
      logout();
      return null;
    }

    scheduleTokenExpiration(token, expiration);
    return token;
  }
  return null;
}

export function setToken(token) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(CURRENT_USER_PROFILE_KEY);
  scheduleTokenExpiration(token, getTokenExpiration(token));
}

export function initializeAuth() {
  getToken();
}

export function isAuthenticated() {
  return !!getToken();
}