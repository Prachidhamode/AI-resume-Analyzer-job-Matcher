import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  FileText, 
  Award, 
  Briefcase, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Upload, 
  Plus, 
  ArrowRight, 
  Calendar,
  Heart,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ onViewResume, onNavigate, showNotification }) {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // New alert form inputs
  const [alertKeyword, setAlertKeyword] = useState('');
  const [alertDept, setAlertDept] = useState('All');
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resumesData, jobsData, appsData, favsData, alertsData] = await Promise.all([
        api.get('/resumes'),
        api.get('/jobs'),
        api.get('/applications'),
        api.get('/jobs/favorites'),
        api.get('/alerts')
      ]);
      setResumes(resumesData);
      setJobs(jobsData);
      setApplications(appsData);
      setFavoriteJobs(favsData);
      setAlerts(alertsData);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/resumes/${id}`);
      setResumes(resumes.filter(r => r.id !== id));
      showNotification('Resume deleted successfully', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete resume', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await api.delete(`/alerts/${alertId}`);
      setAlerts(alerts.filter(a => a.id !== alertId));
      showNotification('Job alert deleted.', 'success');
    } catch (err) {
      showNotification('Failed to delete job alert.', 'error');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertKeyword.trim() && alertDept === 'All') {
      showNotification('Please enter a keyword or select a department.', 'error');
      return;
    }
    try {
      setSavingAlert(true);
      const newAlert = await api.post('/alerts', {
        keyword: alertKeyword.trim(),
        department: alertDept === 'All' ? '' : alertDept
      });
      setAlerts([...alerts, newAlert]);
      setAlertKeyword('');
      setAlertDept('All');
      showNotification('Job alert created successfully!', 'success');
    } catch (err) {
      showNotification('Failed to create job alert.', 'error');
    } finally {
      setSavingAlert(false);
    }
  };

  const getAlertMatchesCount = (alert) => {
    return jobs.filter(job => {
      const matchesKeyword = alert.keyword 
        ? job.title.toLowerCase().includes(alert.keyword.toLowerCase()) || 
          job.requiredSkills.some(s => s.toLowerCase().includes(alert.keyword.toLowerCase()))
        : true;
      const matchesDept = alert.department
        ? job.department === alert.department
        : true;
      return matchesKeyword && matchesDept;
    }).length;
  };

  // Compute Statistics
  const totalResumes = resumes.length;
  const averageScore = totalResumes > 0 
    ? Math.round(resumes.reduce((sum, r) => sum + (r.score || 0), 0) / totalResumes) 
    : 0;
  const totalJobs = jobs.length;
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading your career dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="gradient-text">{JSON.parse(localStorage.getItem('user'))?.name || 'User'}</span>
          </h1>
          <p className="text-slate-400 mt-1">Analyze resumes, match job skillsets, and track recommendations.</p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resume</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute right-4 bottom-4 opacity-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Resumes Parsed</span>
              <p className="text-4xl font-extrabold">{totalResumes}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manage resume revisions</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute right-4 bottom-4 opacity-5 text-emerald-405 group-hover:scale-110 transition-transform duration-300">
            <Award className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Average Score</span>
              <p className="text-4xl font-extrabold">{averageScore}<span className="text-lg text-slate-500 font-normal">/100</span></p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Targeting 80+ for ATS compliance</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute right-4 bottom-4 opacity-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
            <Briefcase className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Target Jobs</span>
              <p className="text-4xl font-extrabold">{totalJobs}</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Briefcase className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1" onClick={() => onNavigate('jobs')}>
            <span className="hover:text-cyan-400 cursor-pointer flex items-center gap-1">
              Browse openings board <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left side (resumes + applications) and Right side (favorites + alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Column - Spans 2 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Resumes Library */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Resume Library</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 rounded-full text-slate-400">
                {totalResumes} Resumes
              </span>
            </div>

            {resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm font-medium">No resumes uploaded yet.</p>
                <button
                  onClick={() => onNavigate('upload')}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 font-semibold text-sm flex items-center gap-1"
                >
                  Upload your first resume <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Resume File</th>
                      <th className="pb-3 text-center">Score</th>
                      <th className="pb-3">Engine</th>
                      <th className="pb-3">Uploaded</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {resumes.map((resume) => (
                      <tr 
                        key={resume.id} 
                        onClick={() => onViewResume(resume.id)}
                        className="group/row hover:bg-slate-800/20 cursor-pointer transition-colors duration-150"
                      >
                        <td className="py-4 pl-2 font-medium text-slate-200 group-hover/row:text-indigo-400 transition-colors">
                          <div className="flex items-center gap-3 max-w-[200px] sm:max-w-xs truncate">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate">{resume.fileName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(resume.score)}`}>
                            {resume.score || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-mono text-slate-400">
                          {resume.analysisType?.replace(' Engine', '') || 'Local'}
                        </td>
                        <td className="py-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDate(resume.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-2 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => onViewResume(resume.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="View Analysis"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              disabled={deletingId === resume.id}
                              onClick={(e) => handleDeleteResume(resume.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Delete Resume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Job Applications Tracker */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <span>Job Applications Status Tracker</span>
            </h2>
            {applications.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-900/15">
                <p className="text-xs text-slate-500 italic">No job applications submitted yet.</p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="mt-3 text-xs font-bold text-indigo-400 hover:underline"
                >
                  Explore job openings & apply
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-450 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Job Opening</th>
                      <th className="pb-3">Resume Used</th>
                      <th className="pb-3 text-center">ATS Match</th>
                      <th className="pb-3 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/10">
                        <td className="py-4 pl-2 font-semibold text-slate-200">
                          <div>{app.jobTitle}</div>
                          <div className="text-[10px] text-slate-550 font-medium">{app.company} • {app.location}</div>
                        </td>
                        <td className="py-4 text-slate-400 max-w-[150px] truncate">{app.resumeName}</td>
                        <td className="py-4 text-center">
                          <span className="font-bold text-indigo-400">{app.matchScore}%</span>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                            app.status === 'Shortlisted' 
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400' 
                              : app.status === 'Rejected'
                                ? 'bg-rose-500/15 border-rose-500/35 text-rose-455'
                                : 'bg-indigo-500/15 border-indigo-500/35 text-indigo-400'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side Column */}
        <div className="space-y-8">
          
          {/* Saved / Favorite Jobs */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span>Saved Jobs ({favoriteJobs.length})</span>
            </h2>
            {favoriteJobs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                No saved jobs yet. Tap the ❤️ icon on job cards to bookmark them.
              </div>
            ) : (
              <div className="space-y-3.5">
                {favoriteJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex justify-between items-center gap-3 hover:border-slate-800 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{job.title}</h4>
                      <p className="text-[9px] text-slate-500 font-semibold">{job.company} • {job.location}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('jobs')}
                      className="px-2.5 py-1 bg-slate-850 hover:bg-indigo-500 text-slate-400 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job Alerts panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-400" />
              <span>Configure Job Alerts</span>
            </h2>
            
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keywords (Role / Skill)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Docker, Python"
                  value={alertKeyword}
                  onChange={(e) => setAlertKeyword(e.target.value)}
                  className="w-full bg-slate-905 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-550"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                <select
                  value={alertDept}
                  onChange={(e) => setAlertDept(e.target.value)}
                  className="w-full bg-slate-905 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="Software Development">Software Development</option>
                  <option value="AI & Data">AI & Data</option>
                  <option value="Cloud & Security">Cloud & Security</option>
                  <option value="Design">Design</option>
                  <option value="Business & Other">Business & Other</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={savingAlert}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-550/15"
              >
                {savingAlert ? 'Saving alert...' : 'Create Alert'}
              </button>
            </form>

            {/* Alerts List */}
            {alerts.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-900">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Alerts</p>
                <div className="space-y-2">
                  {alerts.map((alert) => {
                    const matches = getAlertMatchesCount(alert);
                    return (
                      <div key={alert.id} className="p-3 border border-slate-850 bg-slate-900/10 rounded-xl flex justify-between items-center gap-2">
                        <div className="text-xs">
                          <p className="font-semibold text-slate-200">
                            {alert.keyword || 'Any Keyword'}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium">
                            Dept: {alert.department || 'All'} • <span className="text-indigo-400 font-bold">{matches} matches</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-[10px] font-bold text-rose-450 hover:text-rose-350 px-1"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
