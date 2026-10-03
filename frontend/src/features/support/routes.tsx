import type { RouteObject } from "react-router-dom";
import { SupportPage } from "./SupportPage";

export const routes: RouteObject[] = [
  { path: "/support", element: <SupportPage />, handle: { nav: "support" } },
];
