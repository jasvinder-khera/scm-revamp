import "../styles/global.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAuthenticationPage = ["/login", "/register"].includes(router.pathname);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </Head>
      {isAuthenticationPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
}