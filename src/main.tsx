import { ConvexReactClient } from "convex/react";

// Export a helper to get a Convex client. In Next we'll use process.env.NEXT_PUBLIC_CONVEX_URL
export function createConvexClient(url?: string) {
  return new ConvexReactClient(url ?? process.env.NEXT_PUBLIC_CONVEX_URL as string);
}

// No DOM mounting here — Next will render the app.
