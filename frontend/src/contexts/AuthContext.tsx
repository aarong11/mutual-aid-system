import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  isCoordinator: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('authToken')
  );
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      // Parse JWT token to check role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsCoordinator(['coordinator', 'admin'].includes(payload.role));
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        console.error('Error parsing token:', error);
        logout();
      }
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setIsCoordinator(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, isCoordinator, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};