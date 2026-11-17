// frontend/lib/auth.js
import { loginApi } from "./apiEndpoints";

export async function login(email, password) {
  try {
    const response = await loginApi(email, password);
    const { data, status } = response;
    if (status < 200 || status >= 300 || !data?.access_token) {
      throw new Error(data?.detail || data?.message || "Login failed");
    }
    
    // Save token to localStorage
    localStorage.setItem("token", data.access_token);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Invalid email or password" };
  }
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function isAuthenticated() {
  return !!getToken();
}