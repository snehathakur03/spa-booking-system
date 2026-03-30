import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useStore from './store';
import ErrorBoundary from './components/ui/ErrorBoundary';

const LoginPage    = lazy(() => import('./pages/LoginPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { retry: 1, staleTime: 30000 },
    mutations: { retry: 0 },
  },
});

const Spinner = () => (
  <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080816' }}>
    <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(124,106,255,0.2)', borderTop:'3px solid #7c6aff', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{margin:0;padding:0;box-sizing:border-box} html,body{height:100%}`}</style>
  </div>
);

// Reads a single boolean from the store — re-renders only when auth changes
const AppContent = () => {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  return isAuthenticated ? <CalendarPage /> : <LoginPage />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <AppContent />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
