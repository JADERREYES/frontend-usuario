import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Algo interrumpio esta pantalla';
  let description = 'Puedes volver al inicio o recargar la pagina para intentarlo de nuevo.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'No encontramos lo que buscabas';
      description = 'La ruta que intentaste abrir no esta disponible.';
    } else if (error.status >= 500) {
      title = 'Tuvimos un problema al abrir esta vista';
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-lg space-y-5 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">MenteAmiga AI</p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[var(--text-main)]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#baa2ff_0%,#ffd6c5_100%)] px-5 text-sm font-semibold text-slate-900"
          >
            Volver al inicio
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/75 px-5 text-sm font-semibold text-[var(--text-main)]"
          >
            Recargar pagina
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
