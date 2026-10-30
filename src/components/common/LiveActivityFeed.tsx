import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Radio,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Activity,
  X,
  ChevronRight,
  Wifi
} from 'lucide-react';

interface LiveActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ isOpen, onClose }) => {
  const { status, activeMembers, activities } = useRealtime();
  const { activeProject } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Live Collaboration Feed
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                {status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Real-time WebSocket stream (/ws)
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Online Teammates Section */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-2.5 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Active in Project ({activeMembers.length})</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Live Presence</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {activeMembers.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0"
            >
              <div className="relative">
                <img
                  src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={m.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[80px]">
                  {m.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-slate-400 uppercase capitalize">{m.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Activity Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Live Event Log
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Waiting for real-time actions...
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((act) => {
              const Icon = act.type === 'annotation'
                ? CheckCircle2
                : act.type === 'review'
                ? Sparkles
                : act.type === 'flag'
                ? Flag
                : Activity;

              const iconColor = act.type === 'annotation'
                ? 'text-emerald-500'
                : act.type === 'review'
                ? 'text-purple-500'
                : act.type === 'flag'
                ? 'text-rose-500'
                : 'text-indigo-500';

              return (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-xs"
                >
                  <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 leading-relaxed">
                      <strong className="font-bold text-slate-900">{act.user.name}</strong> {act.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400">
        Connected to WebSocket server with sub-10ms event broadcasts
      </div>

    </div>
  );
};
