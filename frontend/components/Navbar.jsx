import Link from "next/link";
import Image from "next/image";
import { logout } from "../lib/auth";
import scmLogo from '../public/scm-logo.png'

export default function Navbar() {
  return (
    <header className="flex justify-between h-18 items-center border-b border-[#1e4c8c] bg-[#212e44] px-4 text-white shadow-sm">
      <Link
        href="/"
        className="text-lg font-bold tracking-wide"
        aria-label="SCM Revamp home"
      >
        <Image src={scmLogo} alt="SCM Portal Logo" className="transition-all duration-300 h-16 w-auto" />
      </Link>
      <button
        onClick={logout}
        className="text-sm font-semibold bg-transparent hover:bg-white/10 px-3 py-1.5 border border-white/20 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
