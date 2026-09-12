import React from 'react';
import {
  Satellite,
  Home,
  Compass,
  History,
  Settings,
  PlusCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { BackendHealthResponse } from '../services/api';
import { User } from '../types/auth';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onNewAnalysis?: () => void;
  backendHealth?: BackendHealthResponse | null;
  user?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onNewAnalysis,
  backendHealth,
  user,
  onLogout,
}) => {
  const isOnline = backendHealth?.ok && backendHealth?.status === 'Online';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analysis', label: 'Analysis', icon: Compass },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="w-64 bg-[#080d1a]/95 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-30 backdrop-blur-md"
    >
      {/* Brand Header */}
      <div>
        <div
          onClick={() => setCurrentTab('home')}
          className="p-5 border-b border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:border-cyan-400 transition-colors">
              <Satellite className="w-5 h-5 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                  SatQuery <span className="text-cyan-400">AI</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Satellite Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Prominent "Add Satellite Images" Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              setCurrentTab('analysis');
              onNewAnalysis?.();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Add Satellite Images</span>
          </button>
        </div>

        {/* 4 Simple Navigation Items */}
        <nav className="mt-2 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        {/* Authenticated User Profile Card */}
        {user && (
          <div
            id="sidebar-user-card"
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            {onLogout && (
              <button
                id="btn-sidebar-logout"
                onClick={onLogout}
                title="Sign out of SatQuery AI"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* System Status */}
        <div className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              {isOnline ? 'AI Backend Ready' : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Online</span>
        </div>
      </div>
    </aside>
  );
};
