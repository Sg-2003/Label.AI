import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Project } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User;
  users: User[];
  activeProject: Project | null;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  demoLogin: (userId: string) => void;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  register: (name: string, email: string) => User;
  isAdmin: boolean;
  isAnnotator: boolean;
  isReviewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => storage.hasActiveSession());
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const projects = storage.getProjects();
    return projects[0]?.id || '';
  });

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setIsAuthenticated(storage.hasActiveSession());
      setCurrentUser(storage.getCurrentUser());
      setUsers(storage.getUsers());
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial slight delay for authentic feel & security feedback
    await new Promise((r) => setTimeout(r, 200));
    const result = storage.loginUser(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error || 'Authentication failed' };
  };

  const signup = async (
    name: string,
    email: string,
    role: UserRole,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 200));
    const result = storage.registerUser(name, email, role, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error || 'Registration failed' };
  };

  const logout = () => {
    storage.logoutUser();
    setIsAuthenticated(false);
  };

  const demoLogin = (userId: string) => {
    storage.setCurrentUser(userId);
    setIsAuthenticated(true);
    setCurrentUser(storage.getCurrentUser());
  };

  const switchUser = (userId: string) => {
    storage.setCurrentUser(userId);
    setIsAuthenticated(true);
    setCurrentUser(storage.getCurrentUser());
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    storage.updateUserRole(userId, role);
    setUsers(storage.getUsers());
    setCurrentUser(storage.getCurrentUser());
  };

  const register = (name: string, email: string): User => {
    const res = storage.registerUser(name, email, 'annotator');
    setUsers(storage.getUsers());
    return res.user || storage.getCurrentUser();
  };

  const activeProject = storage.getProject(activeProjectId) || null;

  const isAdmin = currentUser ? currentUser.role === 'admin' : false;
  const isAnnotator = currentUser ? currentUser.role === 'annotator' : false;
  const isReviewer = currentUser ? currentUser.role === 'reviewer' : false;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        users,
        activeProject,
        activeProjectId,
        setActiveProjectId,
        login,
        signup,
        logout,
        demoLogin,
        switchUser,
        updateUserRole,
        register,
        isAdmin,
        isAnnotator,
        isReviewer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

