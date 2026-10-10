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

  it("should lazy-load every route component", async () => {
    const collect = (list: any[]): any[] =>
      list.flatMap((r) => [r, ...(r.children ? collect(r.children) : [])]);

    const components = collect(routes)
      .map((r) => r.component)
      .filter(Boolean);

    expect(components.length).toBe(9);

    const modules = await Promise.all(components.map((load: any) => load()));
    modules.forEach((mod) => expect(mod.default).toBeDefined());
  });
});
