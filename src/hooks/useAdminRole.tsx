import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth.tsx';

interface AdminContextType {
  isAdmin: boolean;
  setAsAdmin: () => void;
  unsetAsAdmin: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth(); // Consume auth context

  useEffect(() => {
    try {
        const storedIsAdmin = localStorage.getItem('isAdmin');
        if (storedIsAdmin) {
          setIsAdmin(JSON.parse(storedIsAdmin));
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  // Effect to sync with auth state
  useEffect(() => {
    if (!isAuthenticated) {
      unsetAsAdmin();
    }
  }, [isAuthenticated]);

  const setAsAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('isAdmin', JSON.stringify(true));
  };

  const unsetAsAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, setAsAdmin, unsetAsAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminRole = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminRole must be used within an AdminProvider');
  }
  return context;
};
