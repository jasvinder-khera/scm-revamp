// frontend/pages/index.js
import { useEffect, useState } from "react";
import { fetchFromApi } from "../lib/api";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetchFromApi("/api/test")
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Failed to connect to backend"));
  }, []);

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1 className="text-3xl">Laravel Migration Test</h1>
      <p>Backend says: <strong>{message}</strong></p>
    </div>
  );
}