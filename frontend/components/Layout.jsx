import Link from "next/link";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans text-[#181818]">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="w-16 shrink-0 border-r border-gray-200 bg-white py-4 md:w-56">
          <nav aria-label="Main menu">
            <Link
              href="/"
              aria-current="page"
              className="flex items-center justify-center gap-3 border-l-4 border-[#032d60] bg-blue-50 px-3 py-3 text-sm font-semibold text-[#032d60] md:justify-start md:px-4"
              title="Dashboard"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                />
              </svg>
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
