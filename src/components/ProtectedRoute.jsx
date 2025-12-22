import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, autoLogout } = useAuth();
  const hasLoggedOut = useRef(false);
  
  useEffect(() => {
    // If user was previously logged in but now is null and we haven't logged out yet,
    // this means an automatic logout occurred
    if (!user && !hasLoggedOut.current) {
      const wasLoggedIn = localStorage.getItem('wasLoggedIn');
      if (wasLoggedIn === 'true') {
        // Automatic logout happened - log it
        hasLoggedOut.current = true;
        localStorage.removeItem('wasLoggedIn');
      }
    } else if (user) {
      // Mark that user is logged in
      localStorage.setItem('wasLoggedIn', 'true');
    }
  }, [user, autoLogout]);
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is logged in, render the children
  return children;
}

// AdminRoute component - restricts access to admin users only
export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is not an admin, redirect to sales page
  if (!isAdmin) {
    return <Navigate to="/sales" replace />;
  }
  
  // If user is an admin, render the children
  return children;
}
