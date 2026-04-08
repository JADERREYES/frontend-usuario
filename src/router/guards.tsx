import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { GlassCard } from '../components/ui/GlassCard';

export function PublicOnlyGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-10">
        <GlassCard className="max-w-sm text-center">
          <p className="text-sm font-medium text-[var(--text-muted)]">Preparando tu espacio...</p>
        </GlassCard>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}

export function ProtectedGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-10">
        <GlassCard className="max-w-sm text-center">
          <p className="text-sm font-medium text-[var(--text-muted)]">Preparando tu espacio...</p>
        </GlassCard>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
