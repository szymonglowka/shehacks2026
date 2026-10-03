import { Outlet } from 'react-router-dom';

/**
 * Minimal checkpoint-0 shell. Part B replaces this with the full Figma
 * app shell (sidebar / topbar / mobile bottom nav / QuickAdd sheet).
 */
export function Shell() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Outlet />
    </div>
  );
}
