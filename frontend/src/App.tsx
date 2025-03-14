import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Global } from '@emotion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { MapView } from './components/MapView';
import { SubmissionForm } from './components/SubmissionForm';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { Login } from './pages/Login';
import { globalStyles } from './styles/global';
import ErrorBoundary from './components/ErrorBoundary';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f6fa;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
`;

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCoordinator, token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  }
  
  if (!isCoordinator) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <AppContainer>
      <ErrorBoundary>
        <Navigation />
        <Main>
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/submit" element={<SubmissionForm />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/coordinator" 
              element={
                <ProtectedRoute>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Main>
      </ErrorBoundary>
    </AppContainer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Global styles={globalStyles} />
      <AppContent />
    </AuthProvider>
  );
};

export default App;