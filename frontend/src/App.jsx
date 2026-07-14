import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import ResumeDetail from './pages/ResumeDetail';
import JobMatcher from './pages/JobMatcher';
import BrowseJobs from './pages/BrowseJobs';
import { 
  Briefcase, 
  FileText, 
  Upload, 
  LogOut, 
  User, 
  Menu, 
  X,
  Compass,
  AlertCircle,
  CheckCircle,
  Terminal,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // SPA Routing Page States: 'dashboard', 'upload', 'resume-detail', 'matcher', 'jobs'
  const [page, setPage] = useState('dashboard');
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState(null);
  
  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Listen to JWT expiration event
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken('');
      setUser(null);
      showNotification('Your session has expired. Please login again.', 'error');
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (!isLogin && !authName)) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin 
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword };

      const data = await api.post(endpoint, payload);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      setPage('dashboard');
      showNotification(isLogin ? `Welcome back, ${data.user.name}!` : 'Account created successfully!', 'success');
      
      // Clear inputs
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err) {
      showNotification(err.message || 'Authentication failed.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setPage('dashboard');
    showNotification('Logged out successfully.', 'success');
  };

  const navigateToResume = (id) => {
    setSelectedResumeId(id);
    setPage('resume-detail');
  };

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
    setMobileMenuOpen(false);
  };

  // Authentication view (Login / Signup Screen)
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
        {/* Glow decorative items */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-slate-800 space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400 mb-2">
              <Terminal className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              CV <span className="gradient-text">Analyzer AI</span>
            </h1>
            <p className="text-slate-400 text-sm">Upload, parse, score and match resumes instantly.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. john@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <span>{isLogin ? 'Login Securely' : 'Register Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center text-sm text-slate-400 pt-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {notification && (
          <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-up ${
            notification.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-950/20' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-950/20'
          }`}>
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
        )}
      </div>
    );
  }

  // Dashboard Main View layout
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navbar Header */}
      <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => handleNavigate('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-2 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-xl border border-indigo-500/30 text-indigo-400 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              CV<span className="gradient-text">Analyzer</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                page === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNavigate('upload')}
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                page === 'upload' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload CV</span>
            </button>
            <button
              onClick={() => handleNavigate('jobs')}
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                page === 'jobs' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Jobs</span>
            </button>
            <button
              onClick={() => handleNavigate('matcher')}
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                page === 'matcher' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Job Matcher</span>
            </button>
          </nav>

          {/* User Section / Logout */}
          <div className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-900/50 rounded-lg transition-all"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-300">{user.name}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-900/50 rounded-lg transition-all"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-450 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 py-4 px-6 space-y-3 relative z-30 animate-slide-up">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-semibold flex items-center gap-2 ${
              page === 'dashboard' ? 'bg-indigo-550/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigate('upload')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-semibold flex items-center gap-2 ${
              page === 'upload' ? 'bg-indigo-555/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
          <button
            onClick={() => handleNavigate('jobs')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-semibold flex items-center gap-2 ${
              page === 'jobs' ? 'bg-indigo-555/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Browse Jobs</span>
          </button>
          <button
            onClick={() => handleNavigate('matcher')}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-semibold flex items-center gap-2 ${
              page === 'matcher' ? 'bg-indigo-555/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Job Matcher</span>
          </button>
          <div className="pt-2 border-t border-slate-850 flex items-center gap-2.5 px-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-350">{user.name}</span>
          </div>
        </div>
      )}

      {/* Main content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === 'dashboard' && (
          <Dashboard 
            onViewResume={navigateToResume} 
            onNavigate={handleNavigate}
            showNotification={showNotification}
          />
        )}
        {page === 'upload' && (
          <UploadPage 
            onNavigate={handleNavigate}
            onViewResume={navigateToResume}
            showNotification={showNotification}
          />
        )}
        {page === 'jobs' && (
          <BrowseJobs 
            showNotification={showNotification}
            onNavigate={handleNavigate}
          />
        )}
        {page === 'resume-detail' && (
          <ResumeDetail 
            resumeId={selectedResumeId} 
            onBack={() => handleNavigate('dashboard')}
            onNavigate={handleNavigate}
            showNotification={showNotification}
          />
        )}
        {page === 'matcher' && (
          <JobMatcher 
            preselectedResumeId={null} 
            preselectedJobId={null}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center">
        <div className="max-w-7xl mx-auto px-4 text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
          AI Resume Analyzer & Job Matcher • Placement Portal Edition
        </div>
      </footer>

      {/* Global Toast Alert */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-up ${
          notification.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-950/20' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-950/20'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

    </div>
  );
}
