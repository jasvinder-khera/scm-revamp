import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUserApi } from "../lib/api";
import { isAuthenticated, logout } from "../lib/auth";
import scmLogo from "../public/scm-logo.png";

const roleNames = {
  0: "Requester",
  1: "Modifier",
  2: "Buyer",
  3: "Admin",
};

const groupField = {
  1: "E&E",
  2: "B&H",
  3: "M&S",
  4: "Common",
};

export default function Navbar({ isSidebarOpen, onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) return undefined;

    let active = true;
    getCurrentUserApi()
      .then(({ data, status }) => {
        if (!active) return;
        if (status === 401) {
          logout();
          return;
        }
        if (status < 200 || status >= 300) {
          throw new Error(
            data?.detail || data?.message || "Unable to load account details.",
          );
        }
        setUser(data);
      })
      .catch((error) => {
        if (active)
          setProfileError(error.message || "Unable to load account details.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  const userRole = user
    ? roleNames[user.user_role] || `Unknown role (${user.user_role})`
    : "Unavailable";
  const usergf = user
    ? groupField[user.group_field] || `Unknown role (${user.group_field})`
    : "Unavailable";

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-18 items-center justify-between border-b border-[#1e4c8c] bg-[#212e44] px-4 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
          className="rounded p-2 transition-colors hover:bg-white/10"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link
          href="/"
          className="text-lg font-bold tracking-wide"
          aria-label="SCM Revamp home"
        >
          <Image
            src={scmLogo}
            alt="SCM Portal Logo"
            className="transition-all duration-300 h-16 w-auto"
          />
        </Link>
      </div>
      <div className="relative" ref={accountMenuRef}>
        <button
          type="button"
          onClick={() => setIsAccountMenuOpen((open) => !open)}
          aria-expanded={isAccountMenuOpen}
          aria-controls="account-menu"
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
        >
          <div className="h-10 w-10 rounded-full border border-white flex justify-center items-center uppercase">
            {user?.fname?.[0]}
            {user?.lname?.[0]}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="capitalize">
              {user?.fname + " " + user?.lname ||
                (profileError ? "Profile unavailable" : "Loading account...")}
            </span>
            <span className="capitalize">[Group Field: {usergf}]</span>
          </div>
        </button>
        {isAccountMenuOpen && (
          <div
            id="account-menu"
            className="absolute right-0 z-20 mt-2 w-56 border border-gray-200 bg-white py-2 text-sm text-gray-800 shadow-lg"
          >
            <div className="border-b border-gray-200 px-4 py-2">
              <p className="mt-1 text-xs text-gray-600">Role: {userRole}</p>
              {profileError && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                  {profileError}
                </p>
              )}
            </div>
            <Link
              href="/change-password"
              onClick={() => setIsAccountMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-100"
            >
              Change password
            </Link>
            <button
              type="button"
              onClick={logout}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
