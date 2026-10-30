import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  Award,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, currentUser, updateUserRole, register } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    register(inviteName.trim(), inviteEmail.trim());
    setInviteName('');
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'annotator':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'reviewer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Access Control & RBAC
            </span>
            <span className="text-xs text-slate-400">• Phase 5 Authentication & Roles</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Team Members & Role Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Assign user roles (Admin, Annotator, Reviewer), track quality accuracy, and audit activity streaks.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {users.map((u) => {
            const goldAccuracy = u.stats.goldTotal > 0
              ? Math.round((u.stats.goldCorrect / u.stats.goldTotal) * 100)
              : 100;

            return (
              <div
                key={u.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* User info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={u.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-6 text-xs text-center md:text-left">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Annotations</div>
                    <div className="font-extrabold text-slate-800 text-sm">{u.stats.totalLabeled}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Gold Accuracy</div>
                    <div className="font-extrabold text-emerald-600 text-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{goldAccuracy}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Active Streak</div>
                    <div className="font-extrabold text-amber-600 text-sm flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{u.stats.streak}d</span>
                    </div>
                  </div>
                </div>

                {/* Role Switcher & Status */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Role</span>
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${getRoleBadge(u.role)}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="annotator">Annotator</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                  </div>

                  <button
                    onClick={() => storage.toggleUserStatus(u.id)}
                    className={`px-3 py-1.5 mt-4 rounded-xl text-xs font-semibold transition-colors border ${
                      u.isActive
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Team Member</h3>
            <p className="text-xs text-slate-500 mb-5">
              New users are granted Annotator role by default per Phase 5.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="priya@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
