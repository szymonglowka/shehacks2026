import type { RouteObject } from "react-router-dom";
import KnowledgePage from "./pages/KnowledgePage";
import ArticleReaderPage from "./pages/ArticleReaderPage";

export const routes: RouteObject[] = [
  { path: "/knowledge", element: <KnowledgePage /> },
  { path: "/knowledge/:slug", element: <ArticleReaderPage /> },
];
