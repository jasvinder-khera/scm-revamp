import { useEffect } from "react";
import "../styles/global.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { initializeAuth, isAuthenticated } from "../lib/auth";
import ToastProvider from "../components/Toastprovider";

// Routes that exist in the app (excluding auth pages)
const KNOWN_ROUTES = [
  "/",
  "/dashboard",
  "/all-pr",
  "/all-pr-line-items",
  "/deleted-pr",
  "/raise-pr",
  "/user/user-list"
];

const AUTH_ROUTES = ["/login", "/register", "/reset-password"];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const pathname = router.pathname;
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const isKnownRoute = KNOWN_ROUTES.includes(pathname) || isAuthPage;

  useEffect(() => {
    initializeAuth();

    const loggedIn = isAuthenticated();

    if (!loggedIn && !isAuthPage) {
      // Not logged in and trying to access a protected page → go to login
      router.replace("/login");
    } else if (loggedIn && !isKnownRoute) {
      // Logged in but the route doesn't exist → go to dashboard
      router.replace("/dashboard");
    } else if (loggedIn && isAuthPage) {
      // Already logged in and trying to access login/register → go to dashboard
      router.replace("/dashboard");
    }
  }, [pathname, isAuthPage, isKnownRoute, router]);

  return (
    <>
     <ToastProvider>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </Head>
      {isAuthPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
      </ToastProvider>
    </>
  );
}