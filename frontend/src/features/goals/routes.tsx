import type { RouteObject } from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";

export const routes: RouteObject[] = [{ path: "/goals", element: <GoalsPage /> }];
