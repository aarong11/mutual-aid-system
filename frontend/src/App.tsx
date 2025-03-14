import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { Navigation } from './components/Navigation';
import { MapView } from './components/MapView';
import { Login } from './pages/Login';
import { CsvUpload } from './pages/CsvUpload';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './styles/global';
import styled from '@emotion/styled';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f6fa;
`;

const ContentContainer = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

// Protected route component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  requireCoordinator?: boolean;
}> = ({ children, requireCoordinator = false }) => {
  const { token, isCoordinator } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireCoordinator && !isCoordinator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MapView />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/csv-upload" 
        element={
          <ProtectedRoute requireCoordinator>
            <CsvUpload />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/coordinator" 
        element={
          <ProtectedRoute requireCoordinator>
            <CoordinatorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <AppContainer>
            <Navigation />
            <ContentContainer>
              <AppRoutes />
            </ContentContainer>
          </AppContainer>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;