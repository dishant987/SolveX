import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { RouterContext } from "./types/types";

export const router = createRouter({
  routeTree,
  context: { auth: { user: null, hasRole: () => false } } as RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
