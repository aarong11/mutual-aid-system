import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';

const Nav = styled.nav`
  background-color: #2c3e50;
  padding: 1rem 2rem;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: bold;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  color: ${props => props.active ? '#3498db' : 'white'};
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #3498db;
  }
`;

// This ensures the active prop isn't passed to the DOM
const StyledNavLink: React.FC<{ to: string; active?: boolean; children: React.ReactNode }> = ({ active, ...props }) => (
  <NavLink {...props} active={active} />
);

const LogoutButton = styled.button`
  background: none;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: white;
    color: #2c3e50;
  }
`;

const UserInfo = styled.span`
  color: #95a5a6;
  margin-right: 1rem;
`;

export const Navigation: React.FC = () => {
  const { isCoordinator, token, logout, user } = useAuth();
  const location = useLocation();

  return (
    <Nav>
      <NavContent>
        <Logo to="/">Community Aid Map</Logo>
        <NavLinks>
          <StyledNavLink to="/" active={location.pathname === '/'}>
            Map
          </StyledNavLink>
          <StyledNavLink to="/submit" active={location.pathname === '/submit'}>
            Submit Resource
          </StyledNavLink>
          {isCoordinator && (
            <StyledNavLink to="/coordinator" active={location.pathname === '/coordinator'}>
              Review Submissions
            </StyledNavLink>
          )}
          {token ? (
            <>
              {user && <UserInfo>Welcome, {user.username}</UserInfo>}
              <LogoutButton onClick={logout}>Logout</LogoutButton>
            </>
          ) : (
            <StyledNavLink to="/login" active={location.pathname === '/login'}>
              Login
            </StyledNavLink>
          )}
        </NavLinks>
      </NavContent>
    </Nav>
  );
};