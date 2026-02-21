"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "../services/api";

interface AdminContextType {
  isSuperuser: boolean;
  currentUser: User | null;
}

const AdminContext = createContext<AdminContextType>({
  isSuperuser: false,
  currentUser: null,
});

export function AdminProvider({ 
  children, 
  currentUser 
}: { 
  children: ReactNode; 
  currentUser: User | null;
}) {
  return (
    <AdminContext.Provider value={{ 
      isSuperuser: currentUser?.is_superuser || false,
      currentUser 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}








