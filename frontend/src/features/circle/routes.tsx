import type { RouteObject } from "react-router-dom";
import { PublicCirclePage } from "./PublicCirclePage";

export const routes: RouteObject[] = [
  {
    path: "/c/:token",
    element: <PublicCirclePage />,
    handle: { public: true },
  },
];
