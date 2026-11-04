// frontend/pages/dashboard/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAuthenticated, logout } from "../../lib/auth";
import { fetchFromApi } from "../../lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Check if user is logged in
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    // 2. Fetch the logged-in user's data from FastAPI
    // Note: We need to pass the token in the headers
    const token = localStorage.getItem("token");
    fetchFromApi("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(data => setUser(data))
      .catch(() => {
        // If token is invalid/expired, logout
        logout();
      });
  }, [router]);

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.name}!</h2>
          <p className="text-gray-700">Email: {user.email}</p>
          <p className="text-gray-700">User ID: {user.id}</p>
        </div>
      </div>
    </div>
  );
}