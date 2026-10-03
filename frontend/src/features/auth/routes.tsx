import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function WelcomePage() {
  return <Placeholder title="Welcome" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

function LoginPage() {
  return <Placeholder title="Login" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

function RegisterPage() {
  return <Placeholder title="Register" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/welcome', element: <WelcomePage />, handle: { public: true } },
  { path: '/login', element: <LoginPage />, handle: { public: true } },
  { path: '/register', element: <RegisterPage />, handle: { public: true } },
];
