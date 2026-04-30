import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/auth-context';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const MasterPage = lazy(() => import('./pages/MasterPage').then((module) => ({ default: module.MasterPage })));
const OmnitrixPage = lazy(() => import('./pages/OmnitrixPage').then((module) => ({ default: module.OmnitrixPage })));
const PlayerPage = lazy(() => import('./pages/PlayerPage').then((module) => ({ default: module.PlayerPage })));
const RecoveryPage = lazy(() => import('./pages/RecoveryPage').then((module) => ({ default: module.RecoveryPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<Splash />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/personagem" element={<ProtectedRoute role="player"><PlayerPage /></ProtectedRoute>} />
              <Route path="/mestre" element={<ProtectedRoute role="master"><MasterPage /></ProtectedRoute>} />
              <Route path="/omnivita" element={<ProtectedRoute><OmnitrixPage /></ProtectedRoute>} />
              <Route path="/recuperar" element={<RecoveryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootRedirect() {
  const { loading } = useAuth();
  if (loading) return <Splash />;
  return <Navigate to="/login" replace />;
}

function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'master' | 'player' }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && session.user.role !== role) {
    return <Navigate to={session.user.role === 'master' ? '/mestre' : '/personagem'} replace />;
  }
  return <>{children}</>;
}

function Splash() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink text-textMain">
      <div className="rounded-lg border border-line bg-panel p-6 shadow-soft">Carregando OmniVita...</div>
    </main>
  );
}
