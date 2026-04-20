import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '../store/auth.store';
import { I18nProvider } from '../i18n/I18nProvider';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  return <I18nProvider>{children}</I18nProvider>;
}
