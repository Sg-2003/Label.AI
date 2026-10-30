import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtime, ActiveMember, ActivityFeedItem } from '../services/realtime';
import { useAuth } from './AuthContext';

import { Task, Annotation, BoundingBox, WorkerActivityLog } from '../types';

interface RealtimeContextType {
  status: 'connecting' | 'connected' | 'disconnected';
  activeMembers: ActiveMember[];
  activities: ActivityFeedItem[];
  submitAnnotation: (taskId: string, userId: string, label: string, timeTakenSeconds: number, notes?: string, boxes?: BoundingBox[]) => any;
  recordTelemetry: (log: Omit<WorkerActivityLog, 'id' | 'timestamp'>) => any;
  resolveReview: (taskId: string, reviewerId: string, finalLabelName: string) => void;
  flagTask: (taskId: string, userId: string, reason: string) => void;
}


const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeProjectId } = useAuth();
  const [status, setStatus] = useState(realtime.getStatus());
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>(realtime.getActiveMembers());
  const [activities, setActivities] = useState<ActivityFeedItem[]>(realtime.getActivities());

  useEffect(() => {
    const unsubscribe = realtime.subscribe(() => {
      setStatus(realtime.getStatus());
      setActiveMembers(realtime.getActiveMembers());
      setActivities(realtime.getActivities());
    });
    return unsubscribe;
  }, []);

  // Sync project/user room join when active project or user changes
  useEffect(() => {
    if (activeProjectId && currentUser) {
      realtime.joinProject(
        activeProjectId,
        currentUser.id,
        currentUser.role,
        currentUser.name,
        currentUser.avatar
      );
    }
  }, [activeProjectId, currentUser.id, currentUser.role, currentUser.name, currentUser.avatar]);

  return (
    <RealtimeContext.Provider
      value={{
        status,
        activeMembers,
        activities,
        submitAnnotation: realtime.submitAnnotation.bind(realtime),
        recordTelemetry: realtime.recordTelemetry.bind(realtime),
        resolveReview: realtime.resolveReview.bind(realtime),
        flagTask: realtime.flagTask.bind(realtime),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
