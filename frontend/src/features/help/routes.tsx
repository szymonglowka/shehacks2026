import type { RouteObject } from "react-router-dom";
import { HelpPage } from "./HelpPage";

export const routes: RouteObject[] = [
  { path: "/help", element: <HelpPage />, handle: { public: true } },
];
