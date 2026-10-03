import type { RouteObject } from "react-router-dom";
import { ToughDayFlow } from "./ToughDayFlow";

export const routes: RouteObject[] = [
  {
    path: "/tough-day",
    element: <ToughDayFlow />,
    handle: { modal: true },
  },
];
