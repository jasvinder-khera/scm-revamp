import { apiClient } from "./api";

export function loginApi(email, password) {
  return apiClient.post("/api/login", { email, password });
}

export function sendOtpApi(email) {
  return apiClient.post("/api/send-otp", { email });
}

export function verifyOtpApi(email, otpCode) {
  return apiClient.post("/api/verify-otp", { email, otp_code: otpCode });
}

export async function startLoginApi(email, password) {
  // const payload = btoa(JSON.stringify({ email, password }));
  const response = await loginApi(email, password);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      response.data?.detail || response.data?.message || "Invalid email or password"
    );
  }

  return sendOtpApi(email);
}

export function getTestMessageApi() {
  return apiClient.get("/api/test");
}
