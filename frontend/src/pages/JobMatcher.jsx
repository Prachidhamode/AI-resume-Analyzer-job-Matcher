import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Briefcase, 
  FileText, 
  Activity, 
  Plus, 
  MapPin, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle,
  X,
  XCircle
} from 'lucide-react';

export default function JobMatcher({ preselectedResumeId, preselectedJobId, showNotification }) {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [customJobTitle, setCustomJobTitle] = useState('Custom Job Position');

  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // New Job Modal/Panel State
  const [showAddJobPanel, setShowAddJobPanel] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobType, setNewJobType] = useState('Full-time');
  const [newJobExperienceLevel, setNewJobExperienceLevel] = useState('Mid-level');
  const [newJobDepartment, setNewJobDepartment] = useState('Engineering');
  const [addingJob, setAddingJob] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resumesData, jobsData] = await Promise.all([
        api.get('/resumes'),
        api.get('/jobs')
      ]);
      setResumes(resumesData);
      setJobs(jobsData);

      // Handle pre-selections if navigated from elsewhere
      const savedResumeId = preselectedResumeId || localStorage.getItem('selectedResumeId');
      const savedJobId = preselectedJobId || localStorage.getItem('selectedJobId');

      if (savedResumeId) {
        setSelectedResumeId(savedResumeId);
        localStorage.removeItem('selectedResumeId');
      } else if (resumesData.length > 0) {
        setSelectedResumeId(resumesData[0].id);
      }

      if (savedJobId) {
        setSelectedJobId(savedJobId);
        localStorage.removeItem('selectedJobId');
        
        // Auto trigger match if both present
        if (savedResumeId) {
          triggerMatch(savedResumeId, savedJobId);
        }
      } else if (jobsData.length > 0) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err) {
      showNotification('Failed to fetch resume and jobs database.', 'error');
    }
  };

  const triggerMatch = async (resumeId, jobId) => {
    if (!resumeId) {
      showNotification('Please select a resume to match.', 'error');
      return;
    }

    try {
      setMatching(true);
      setMatchResult(null);

      let result;
      if (isCustomJob) {
        // Create a temporary job description to match against
        if (!customJobDesc.trim()) {
          showNotification('Please input a job description to analyze.', 'error');
          setMatching(false);
          return;
        }
        // Save temporary job, then run match, or run a backend post
        const tempJob = await api.post('/jobs', {
          title: customJobTitle || 'Custom Role',
          company: 'Custom Paste',
          description: customJobDesc,
          requiredSkills: []
        });
        
        // Refresh jobs list
        const updatedJobs = await api.get('/jobs');
        setJobs(updatedJobs);
        
        // Run match
        result = await api.get(`/jobs/${tempJob.id}/match/${resumeId}`);
      } else {
        if (!jobId) {
          showNotification('Please select a job description to match.', 'error');
          setMatching(false);
          return;
        }
        result = await api.get(`/jobs/${jobId}/match/${resumeId}`);
      }
      setMatchResult(result);
    } catch (err) {
      showNotification(err.message || 'Error occurred during job match calculation.', 'error');
    } finally {
      setMatching(false);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newJobTitle || !newJobCompany || !newJobDesc) {
      showNotification('Please fill in title, company, and description.', 'error');
      return;
    }

    try {
      setAddingJob(true);
      const createdJob = await api.post('/jobs', {
        title: newJobTitle,
        company: newJobCompany,
        location: newJobLocation,
        salary: newJobSalary,
        description: newJobDesc,
        requiredSkills: newJobSkills,
        jobType: newJobType,
        experienceLevel: newJobExperienceLevel,
        department: newJobDepartment
      });

      setJobs([...jobs, createdJob]);
      setSelectedJobId(createdJob.id);
      setIsCustomJob(false);
      setShowAddJobPanel(false);
      showNotification('Job description added successfully!', 'success');
      
      // Reset Form
      setNewJobTitle('');
      setNewJobCompany('');
      setNewJobLocation('');
      setNewJobSalary('');
      setNewJobSkills('');
      setNewJobDesc('');
      setNewJobType('Full-time');
      setNewJobExperienceLevel('Mid-level');
      setNewJobDepartment('Engineering');
    } catch (err) {
      showNotification(err.message || 'Failed to add job posting', 'error');
    } finally {
      setAddingJob(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            ATS <span className="gradient-text">Job Matcher</span>
          </h1>
          <p className="text-slate-400 mt-1">Cross-compare resumes against job listings or paste custom target descriptions.</p>
        </div>

        <button
          onClick={() => setShowAddJobPanel(true)}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Add New Job Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Selector Panel (Left - spans 1) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 self-start">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-850 pb-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Matching Options</span>
          </h2>

          <div className="space-y-4">
            {/* Resume Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Resume</label>
              {resumes.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  You need to upload a resume first!
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.fileName} (Score: {r.score})</option>
                    ))}
                  </select>
                  <FileText className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Match Target Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Job Source</label>
              <div className="grid grid-cols-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCustomJob(false)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    !isCustomJob ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Job Database
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomJob(true)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    isCustomJob ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paste Description
                </button>
              </div>
            </div>

            {/* Job Selectors */}
            {!isCustomJob ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Job Opening</label>
                {jobs.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No jobs available. Add one.</div>
                ) : (
                  <>
                    <div className="relative">
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        {jobs.map(j => (
                          <option key={j.id} value={j.id}>{j.title} at {j.company}</option>
                        ))}
                      </select>
                      <Briefcase className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    
                    {(() => {
                      const selectedJob = jobs.find(j => j.id === selectedJobId);
                      if (!selectedJob) return null;
                      return (
                        <div className="mt-3 p-3.5 rounded-xl border border-slate-850 bg-slate-900/10 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="font-semibold text-slate-350">{selectedJob.company}</span>
                            <span>{selectedJob.location || 'Remote'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md font-semibold">
                              {selectedJob.jobType || 'Full-time'}
                            </span>
                            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md font-semibold">
                              {selectedJob.experienceLevel || 'Mid-level'}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-semibold">
                              {selectedJob.department || 'Engineering'}
                            </span>
                            {selectedJob.salary && selectedJob.salary !== 'N/A' && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md font-semibold">
                                {selectedJob.salary}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="Enter Job Title (e.g. Node Intern)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Description</label>
                  <textarea
                    rows={6}
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste the full job requirements, skills, and duties here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={() => triggerMatch(selectedResumeId, selectedJobId)}
              disabled={matching || resumes.length === 0}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {matching ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>Matching Skills...</span>
                </>
              ) : (
                <span>Analyze Match Rate</span>
              )}
            </button>
          </div>
        </div>

        {/* Comparison Result Panel (Right - spans 2) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 min-h-[400px] flex flex-col">
          
          {matching && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium">Running semantic skill overlap calculations...</p>
            </div>
          )}

          {!matching && !matchResult && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Activity className="w-12 h-12 text-slate-650 animate-pulse-slow" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-400">Match Report Pending</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Select a resume and job description, then click "Analyze Match Rate" to generate scores.</p>
              </div>
            </div>
          )}

          {!matching && matchResult && (
            <div className="space-y-8 animate-fade-in">
              {/* Score header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl border border-slate-850 bg-slate-900/10">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-200">{matchResult.jobTitle}</h3>
                  <p className="text-xs text-slate-400">{matchResult.company} Match Audit Report</p>
                </div>
                
                <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 shrink-0 ${getScoreColor(matchResult.matchScore)}`}>
                  <span className="text-2xl font-extrabold">{matchResult.matchScore}%</span>
                  <div className="text-[9px] leading-tight font-bold uppercase tracking-wider text-slate-400">
                    <div>Skills</div>
                    <div>Match</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Match Rate Progress</span>
                  <span>{matchResult.matchScore}%</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(matchResult.matchScore)}`}
                    style={{ width: `${matchResult.matchScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Badges section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Matched Skills */}
                <div className="glass-panel rounded-xl p-5 border border-slate-850 space-y-3">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Matched Requirements ({matchResult.matchedSkills?.length || 0})</span>
                  </h4>
                  {matchResult.matchedSkills && matchResult.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedSkills.map((skill, i) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No matching keywords found.</p>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="glass-panel rounded-xl p-5 border border-slate-850 space-y-3">
                  <h4 className="font-bold text-slate-400 flex items-center gap-1.5 text-sm">
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Missing Skills / Gaps ({matchResult.missingSkills?.length || 0})</span>
                  </h4>
                  {matchResult.missingSkills && matchResult.missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills.map((skill, i) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-450 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-450 italic">Excellent! Zero technical gaps found.</p>
                  )}
                </div>
              </div>

              {/* Explanatory feedback */}
              <div className="glass-panel rounded-xl p-5 border border-slate-850 space-y-2">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>AI Matching Analysis</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{matchResult.feedback}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-2">
                  Evaluation engine: {matchResult.analysisType || 'Fallback Parser'}
                </div>
              </div>

              {/* Interview tips */}
              {matchResult.interviewTips && matchResult.interviewTips.length > 0 && (
                <div className="glass-panel rounded-xl p-5 border border-slate-850 space-y-3">
                  <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span>Interview Preparation Tips</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {matchResult.interviewTips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-350 leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Expandable Add Job Sliding Drawer Overlay */}
      {showAddJobPanel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg glass-panel h-screen border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto animate-slide-up bg-slate-950">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                  <span>Create Job Profile</span>
                </h2>
                <button 
                  onClick={() => setShowAddJobPanel(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddJob} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newJobTitle}
                      onChange={(e) => setNewJobTitle(e.target.value)}
                      placeholder="e.g. Node Developer"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company *</label>
                    <input
                      type="text"
                      required
                      value={newJobCompany}
                      onChange={(e) => setNewJobCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      value={newJobLocation}
                      onChange={(e) => setNewJobLocation(e.target.value)}
                      placeholder="e.g. Remote / New York"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salary Range</label>
                    <input
                      type="text"
                      value={newJobSalary}
                      onChange={(e) => setNewJobSalary(e.target.value)}
                      placeholder="e.g. $80,000 - $110,000"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Type</label>
                    <select
                      value={newJobType}
                      onChange={(e) => setNewJobType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Co-op">Co-op</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exp. Level</label>
                    <select
                      value={newJobExperienceLevel}
                      onChange={(e) => setNewJobExperienceLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Junior / Entry">Junior / Entry</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead / Principal">Lead / Principal</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
                    <input
                      type="text"
                      value={newJobDepartment}
                      onChange={(e) => setNewJobDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={newJobSkills}
                    onChange={(e) => setNewJobSkills(e.target.value)}
                    placeholder="e.g. React, Node.js, Git, TypeScript"
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Description *</label>
                  <textarea
                    required
                    rows={8}
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    placeholder="Provide duties, expectations, skills required..."
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingJob}
                  className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                >
                  {addingJob ? 'Saving Profile...' : 'Save Job Profile'}
                </button>
              </form>
            </div>
            
            <div className="text-[10px] text-slate-500 text-center font-medium pt-6">
              Saved profiles will immediately reflect in dashboard matching panels.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
