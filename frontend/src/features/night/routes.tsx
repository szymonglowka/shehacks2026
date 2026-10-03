import type { RouteObject } from "react-router-dom";
import { NightPage } from "./NightPage";

export const routes: RouteObject[] = [
  { path: "/night", element: <NightPage /> },
];
