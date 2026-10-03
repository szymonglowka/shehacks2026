import type { RouteObject } from 'react-router-dom';
import { WelcomePage } from './Welcome';
import { LoginPage } from './Login';
import { RegisterPage } from './Register';

export const routes: RouteObject[] = [
  { path: '/welcome', element: <WelcomePage />, handle: { public: true } },
  { path: '/login', element: <LoginPage />, handle: { public: true } },
  { path: '/register', element: <RegisterPage />, handle: { public: true } },
];
