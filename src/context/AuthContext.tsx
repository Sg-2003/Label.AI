import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Project } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  currentUser: User;
  users: User[];
  activeProject: Project | null;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  register: (name: string, email: string) => User;
  isAdmin: boolean;
  isAnnotator: boolean;
  isReviewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const projects = storage.getProjects();
    return projects[0]?.id || '';
  });

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
      setUsers(storage.getUsers());
    });
    return unsubscribe;
  }, []);

  const switchUser = (userId: string) => {
    storage.setCurrentUser(userId);
    setCurrentUser(storage.getCurrentUser());
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    storage.updateUserRole(userId, role);
    setUsers(storage.getUsers());
    setCurrentUser(storage.getCurrentUser());
  };

  const register = (name: string, email: string) => {
    const user = storage.registerUser(name, email);
    setCurrentUser(user);
    setUsers(storage.getUsers());
    return user;
  };

  const activeProject = storage.getProject(activeProjectId) || null;

  const isAdmin = currentUser.role === 'admin';
  const isAnnotator = currentUser.role === 'annotator';
  const isReviewer = currentUser.role === 'reviewer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        activeProject,
        activeProjectId,
        setActiveProjectId,
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
