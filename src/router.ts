import { createRouter, createWebHistory, type Router, type RouterHistory } from "vue-router";
import { routes as appRoutes } from "./routes";

export { routes } from "./routes";

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  return createRouter({
    history,
    routes: appRoutes,
  });
}

const router = createAppRouter();

export default router;
