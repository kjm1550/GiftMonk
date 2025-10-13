import type { AppProps } from 'next/app';
import React from 'react';
import '../src/index.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';

// Convex client is browser-only; make sure the env var is exposed as NEXT_PUBLIC_
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConvexAuthProvider client={convex}>
      <Component {...pageProps} />
    </ConvexAuthProvider>
  );
}
