import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicOnlyGuard, ProtectedGuard } from './guards';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { PublicLayout } from '../layouts/PublicLayout';
import { AppShell } from '../layouts/AppShell';
import { WelcomeScreen } from '../pages/WelcomeScreen';
import { LoginScreen } from '../pages/LoginScreen';
import { RegisterScreen } from '../pages/RegisterScreen';
import { OnboardingScreen } from '../pages/OnboardingScreen';
import { HomeScreen } from '../pages/HomeScreen';
import { ChatScreen } from '../pages/ChatScreen';
import { HistoryScreen } from '../pages/HistoryScreen';
import { ProfileScreen } from '../pages/ProfileScreen';
import { PersonalizationScreen } from '../pages/PersonalizationScreen';
import { RemindersScreen } from '../pages/RemindersScreen';
import { SubscriptionScreen } from '../pages/SubscriptionScreen';
import { WeeklySummaryScreen } from '../pages/WeeklySummaryScreen';
import { PrivacySecurityScreen } from '../pages/PrivacySecurityScreen';
import { SupportScreen } from '../pages/SupportScreen';

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: <PublicOnlyGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <WelcomeScreen /> },
          { path: '/login', element: <LoginScreen /> },
          { path: '/register', element: <RegisterScreen /> },
        ],
      },
    ],
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: <ProtectedGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [{ path: '/onboarding', element: <OnboardingScreen /> }],
      },
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomeScreen /> },
          { path: '/chat', element: <ChatScreen /> },
          { path: '/history', element: <HistoryScreen /> },
          { path: '/profile', element: <ProfileScreen /> },
          { path: '/personalization', element: <PersonalizationScreen /> },
          { path: '/reminders', element: <RemindersScreen /> },
          { path: '/subscription', element: <SubscriptionScreen /> },
          { path: '/weekly-summary', element: <WeeklySummaryScreen /> },
          { path: '/privacy-security', element: <PrivacySecurityScreen /> },
          { path: '/support', element: <SupportScreen /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace />, errorElement: <RouteErrorBoundary /> },
]);
