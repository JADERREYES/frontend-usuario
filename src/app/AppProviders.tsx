import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '../store/auth.store';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  return <>{children}</>;
}
