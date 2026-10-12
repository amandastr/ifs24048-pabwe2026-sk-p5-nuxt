import { describe, it, expect } from "vitest";
import routerOptions from "./router.options";
import { routes } from "./routes";

describe("router.options", () => {
  it("should return the routes declared in routes.ts", () => {
    const result = (routerOptions as any).routes();
    expect(result).toBe(routes);
  });

  it("should declare auth, dashboard, and wildcard routes", () => {
    const paths = routes.map((route) => route.path);
    expect(paths).toEqual(["/auth", "/", "/:pathMatch(.*)*"]);

    const auth = routes[0].children!.map((c) => c.path);
    expect(auth).toEqual(["login", "register"]);

    const dashboard = routes[1].children!.map((c) => c.path);
    expect(dashboard).toEqual(["", "cash-flows/:cashFlowId", "users", "profile"]);
  });
});
