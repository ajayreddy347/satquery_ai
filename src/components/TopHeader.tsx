import React from 'react';
import {
  Upload,
  History,
  RefreshCw,
  AlertTriangle,
  Home,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { BackendHealthResponse } from '../services/api';
import { User } from '../types/auth';

interface TopHeaderProps {
  currentTab: string;
  backendHealth: BackendHealthResponse | null;
  onRetryConnection: () => Promise<void>;
  isRetryingConnection: boolean;
  onNewAnalysis?: () => void;
  onGoToHistory?: () => void;
  onGoToHome?: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  backendHealth,
  onRetryConnection,
  isRetryingConnection,
  onNewAnalysis,
  onGoToHistory,
  onGoToHome,
  user,
  onLogout,
}) => {
  const isOnline = backendHealth?.ok && backendHealth?.status === 'Online';
  const isConnecting = !backendHealth;

  return (
    <header
      id="top-header"
      className="h-16 bg-[#080d1a]/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-20"
    >
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div
          onClick={onGoToHome}
          className="cursor-pointer group"
          title="Go to SatQuery AI Home"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 font-sans tracking-tight group-hover:text-cyan-300 transition-colors">
              SatQuery <span className="text-cyan-400">AI</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden md:block">
            “Understand your satellite imagery with AI.”
          </p>
        </div>
      </div>

      {/* Right Controls: User Profile, Logout & System Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isConnecting ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span className="text-[11px] hidden sm:inline">Connecting...</span>
          </div>
        ) : isOnline ? (
          <div
            id="system-status-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-medium text-[11px]">System Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-medium text-[11px]">Offline</span>
            </div>
            <button
              onClick={onRetryConnection}
              disabled={isRetryingConnection}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 transition disabled:opacity-50 cursor-pointer"
              title="Retry connection"
            >
              <RefreshCw className={`w-3 h-3 ${isRetryingConnection ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* User profile & visible Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div
              id="topheader-user-badge"
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-200 font-medium max-w-[120px] truncate">{user.name}</span>
            </div>

            {onLogout && (
              <button
                id="btn-top-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-700/80 hover:border-rose-500/60 text-xs text-slate-300 hover:text-rose-300 font-medium transition cursor-pointer"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
