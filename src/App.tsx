import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HomeView } from './components/HomeView';
import { SimpleWorkflowView } from './components/SimpleWorkflowView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ReportModal } from './components/ReportModal';
import { AuthView } from './components/AuthView';
import { AnalysisMode, AnalysisResult, HistoryItem } from './types';
import { User, AuthBackendStatus } from './types/auth';
import { HISTORY_ITEMS } from './data/mockData';
import {
  BackendHealthResponse,
  getBackendHealth,
  fetchHistory,
  addHistoryItemApi,
} from './services/api';
import {
  getCurrentSession,
  getAuthBackendStatus,
  logoutUser,
} from './services/authService';
import { Satellite } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [backendAuthStatus, setBackendAuthStatus] = useState<AuthBackendStatus | null>(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // Navigation: 'home' | 'analysis' | 'history' | 'settings'
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [reportModalResult, setReportModalResult] = useState<AnalysisResult | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(HISTORY_ITEMS);
  const [activeLoadedResult, setActiveLoadedResult] = useState<AnalysisResult | null>(null);
  const [preferredMode, setPreferredMode] = useState<AnalysisMode>('bi-temporal');

  // Backend telemetry status
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState<boolean>(false);

  // Verify authentication session on startup
  const checkAuthSession = useCallback(async () => {
    try {
      const [status, session] = await Promise.allSettled([
        getAuthBackendStatus(),
        getCurrentSession(),
      ]);

      if (status.status === 'fulfilled') {
        setBackendAuthStatus(status.value);
      }

      if (session.status === 'fulfilled' && session.value && session.value.user) {
        setCurrentUser(session.value.user);
        setIsAuthenticated(true);
        if (session.value.backendStatus) {
          setBackendAuthStatus(session.value.backendStatus);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      const health = await getBackendHealth();
      setBackendHealth(health);
    } catch (err) {
      console.warn('Backend health poll warning:', err);
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  // Sync initial history from server
  const syncHistory = useCallback(async () => {
    try {
      const remoteHistory = await fetchHistory();
      if (remoteHistory && remoteHistory.length > 0) {
        setHistoryItems(remoteHistory);
      }
    } catch {
      // Keep fallback
    }
  }, []);

  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  useEffect(() => {
    if (isAuthenticated) {
      checkHealth();
      syncHistory();
      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkHealth, syncHistory]);

  // Handle successful login or account registration
  const handleAuthenticated = (user: User, token: string, status: AuthBackendStatus) => {
    setCurrentUser(user);
    setBackendAuthStatus(status);
    setIsAuthenticated(true);
    setSessionExpiredMessage(null);
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentTab('home');
    setSessionExpiredMessage(null);
  };

  // When a new analysis completes
  const handleAnalysisComplete = async (newEntry: HistoryItem) => {
    setHistoryItems((prev) => [newEntry, ...prev]);
    await addHistoryItemApi(newEntry);
  };

  // Launch analysis from Home or Header
  const handleStartAnalysis = (mode?: 'single' | 'compare' | 'optical-sar') => {
    if (mode === 'single') setPreferredMode('single');
    else if (mode === 'optical-sar') setPreferredMode('optical-sar');
    else setPreferredMode('bi-temporal');

    setActiveLoadedResult(null);
    setCurrentTab('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Allow HistoryView to load a specific result into view on Analysis page
  const handleLoadHistoryItem = (result: AnalysisResult) => {
    setActiveLoadedResult(result);
    setCurrentTab('analysis');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // 1. Initial Session Checking Screen
  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#050811] flex flex-col items-center justify-center text-slate-100 font-sans relative overflow-hidden">
        <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-pulse">
            <Satellite className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="text-center space-y-1">
            <div className="text-lg font-bold tracking-wider text-white">SatQuery AI</div>
            <div className="text-xs text-cyan-400/80 font-mono">Initializing secure authenticated session...</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login / Sign-up / Forgot Password View
  if (!isAuthenticated) {
    return (
      <AuthView
        backendStatus={backendAuthStatus}
        onAuthenticated={handleAuthenticated}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  // 3. Authenticated: Render Main SatQuery AI Application
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050811] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onNewAnalysis={() => handleStartAnalysis('compare')}
        backendHealth={backendHealth}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          backendHealth={backendHealth}
          onRetryConnection={checkHealth}
          isRetryingConnection={isRefreshingHealth}
          onNewAnalysis={() => handleStartAnalysis('compare')}
          onGoToHistory={() => setCurrentTab('history')}
          onGoToHome={() => setCurrentTab('home')}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Scrollable Page Body */}
        <main
          id="main-scroll-container"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10"
        >
          {/* HOME SECTION */}
          {currentTab === 'home' && (
            <HomeView
              onStartAnalysis={handleStartAnalysis}
              onViewHistory={() => setCurrentTab('history')}
            />
          )}

          {/* ANALYSIS SECTION */}
          {(currentTab === 'analysis' || currentTab === 'dashboard') && (
            <SimpleWorkflowView
              onAnalysisComplete={handleAnalysisComplete}
              activeLoadedResult={activeLoadedResult}
              initialMode={preferredMode}
            />
          )}

          {/* HISTORY SECTION */}
          {currentTab === 'history' && (
            <HistoryView
              historyItems={historyItems}
              onLoadHistoryItem={handleLoadHistoryItem}
              onOpenReportModal={(res) => setReportModalResult(res)}
              onRefreshHistory={syncHistory}
              onClearHistory={() => setHistoryItems([])}
            />
          )}

          {/* SETTINGS SECTION */}
          {currentTab === 'settings' && (
            <SettingsView
              user={currentUser}
              onLogout={handleLogout}
              backendStatus={backendAuthStatus}
            />
          )}
        </main>
      </div>

      {/* Structured Intelligence Dossier Modal */}
      {reportModalResult && (
        <ReportModal
          result={reportModalResult}
          onClose={() => setReportModalResult(null)}
        />
      )}
    </div>
  );
}
