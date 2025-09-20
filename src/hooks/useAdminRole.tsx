import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  useEffect(() => {
    const storedIsAdmin = sessionStorage.getItem('isAdmin');
    if (storedIsAdmin) {
      setIsAdmin(JSON.parse(storedIsAdmin));
    }
    setLoading(false);
  }, []);

  const setAsAdmin = () => {
    setIsAdmin(true);
    sessionStorage.setItem('isAdmin', JSON.stringify(true));
  };

  const unsetAsAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
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
