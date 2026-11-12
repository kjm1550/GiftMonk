import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import '../src/index.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';

// Convex client is browser-only; make sure the env var is exposed as NEXT_PUBLIC_
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConvexAuthProvider client={convex}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
      </Head>
      <Component {...pageProps} />
    </ConvexAuthProvider>
  );
}
