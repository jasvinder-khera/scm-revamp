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
  await loginApi(email, password);
  return sendOtpApi(email);
}

export function getTestMessageApi() {
  return apiClient.get("/api/test");
}
