import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Search, 
  Heart, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  X, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function BrowseJobs({ showNotification, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedExp, setSelectedExp] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');
  
  // Sorting state: 'newest' or 'matchScore'
  const [sortBy, setSortBy] = useState('newest');
  
  // UI states
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [applying, setApplying] = useState(false);
  
  // Match score caches (jobId -> matchData)
  const [matchScores, setMatchScores] = useState({});
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Recalculate match scores when resume changes
  useEffect(() => {
    if (selectedResumeId) {
      fetchRecommendations(selectedResumeId);
    } else {
      setMatchScores({});
    }
  }, [selectedResumeId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [jobsData, favoritesData, applicationsData, resumesData] = await Promise.all([
        api.get('/jobs'),
        api.get('/jobs/favorites'),
        api.get('/applications'),
        api.get('/resumes')
      ]);

      setJobs(jobsData);
      setFavorites(favoritesData.map(f => f.id));
      setApplications(applicationsData);
      setResumes(resumesData);

      if (resumesData.length > 0) {
        setSelectedResumeId(resumesData[0].id);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to fetch job board details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (resumeId) => {
    try {
      setMatchingInProgress(true);
      const recommendations = await api.get(`/jobs/recommendations?resumeId=${resumeId}`);
      
      const scores = {};
      recommendations.forEach(rec => {
        scores[rec.id] = rec.matchScore;
      });
      setMatchScores(scores);
    } catch (err) {
      showNotification('Failed to generate resume recommendations.', 'error');
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleToggleFavorite = async (jobId, e) => {
    e.stopPropagation();
    try {
      const data = await api.post(`/jobs/${jobId}/favorite`);
      if (data.favorited) {
        setFavorites([...favorites, jobId]);
        showNotification('Job saved to favorites.', 'success');
      } else {
        setFavorites(favorites.filter(id => id !== jobId));
        showNotification('Job removed from favorites.', 'success');
      }
    } catch (err) {
      showNotification('Error saving job.', 'error');
    }
  };

  const handleApplyClick = (job, e) => {
    e.stopPropagation();
    if (resumes.length === 0) {
      showNotification('Please upload a resume first to apply for jobs.', 'error');
      onNavigate('upload');
      return;
    }
    setJobToApply(job);
    setShowApplyModal(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedResumeId || !jobToApply) return;
    try {
      setApplying(true);
      const data = await api.post(`/jobs/${jobToApply.id}/apply`, { resumeId: selectedResumeId });
      
      // Update applications state locally
      const enrichedApp = {
        id: data.id,
        jobId: jobToApply.id,
        resumeId: selectedResumeId,
        status: data.status,
        matchScore: data.matchScore || 0,
        createdAt: data.createdAt,
        jobTitle: jobToApply.title,
        company: jobToApply.company,
        location: jobToApply.location,
        resumeName: resumes.find(r => r.id === selectedResumeId)?.fileName || 'Selected Resume'
      };
      
      setApplications([...applications, enrichedApp]);
      showNotification(`Application submitted! Status: ${data.status}`, 'success');
      setShowApplyModal(false);
      
      // If we are looking at this job in the detail panel, refresh it
      if (selectedJob && selectedJob.id === jobToApply.id) {
        setSelectedJob(null);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to submit application.', 'error');
    } finally {
      setApplying(false);
    }
  };

  // Check if user has applied to a job
  const getApplicationForJob = (jobId) => {
    return applications.find(a => a.jobId === jobId);
  };

  // Filtering Logic
  const filteredJobs = jobs.filter(job => {
    // Search Term match (title, company, requiredSkills)
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDept = selectedDept === 'All' || job.department === selectedDept;
    const matchesExp = selectedExp === 'All' || job.experienceLevel === selectedExp;
    const matchesType = selectedType === 'All' || job.jobType === selectedType;
    
    // Location / Remote match
    let matchesLoc = true;
    if (selectedLoc !== 'All') {
      const locationLower = job.location.toLowerCase();
      if (selectedLoc === 'Remote') {
        matchesLoc = locationLower.includes('remote');
      } else if (selectedLoc === 'Hybrid') {
        matchesLoc = locationLower.includes('hybrid');
      } else if (selectedLoc === 'On-site') {
        matchesLoc = !locationLower.includes('remote') && !locationLower.includes('hybrid');
      }
    }

    // Salary range match (low <80, mid 80-120, high >120)
    let matchesSalary = true;
    if (selectedSalary !== 'All') {
      // Basic parse: extract digits
      const digits = job.salary.replace(/[^0-9]/g, '');
      const parsedSalary = parseInt(digits.substring(0, 3) + '000') || 90000;
      if (selectedSalary === 'Low') {
        matchesSalary = parsedSalary < 80000;
      } else if (selectedSalary === 'Medium') {
        matchesSalary = parsedSalary >= 80000 && parsedSalary <= 120000;
      } else if (selectedSalary === 'High') {
        matchesSalary = parsedSalary > 120000;
      }
    }

    return matchesSearch && matchesDept && matchesExp && matchesType && matchesLoc && matchesSalary;
  });

  // Sorting Logic
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'matchScore') {
      const scoreA = matchScores[a.id] || 0;
      const scoreB = matchScores[b.id] || 0;
      return scoreB - scoreA;
    }
    // Default: newest first (since we seeded in order, newer items are appended)
    return 0; // maintain database order
  });

  // Calculate detailed match score data when opening a job
  const handleOpenJobDetails = async (job) => {
    if (selectedResumeId) {
      try {
        setLoading(true);
        const matchDetails = await api.get(`/jobs/${job.id}/match/${selectedResumeId}`);
        setSelectedJob({
          ...job,
          matchData: matchDetails
        });
      } catch (err) {
        showNotification('Failed to fetch detailed AI skill gap analysis.', 'error');
        // Open without match details if fails
        setSelectedJob(job);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedJob(job);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-450 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Shortlisted':
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
      case 'Rejected':
        return 'bg-rose-500/15 border-rose-500/35 text-rose-400';
      default:
        return 'bg-indigo-500/15 border-indigo-500/35 text-indigo-400';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Opening placement job board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Browse <span className="gradient-text">Job Openings</span>
          </h1>
          <p className="text-slate-400 mt-1">Explore job profiles, apply filters, and analyze your skill compatibility score.</p>
        </div>

        {/* Selected Resume for recommendations */}
        {resumes.length > 0 && (
          <div className="glass-panel p-3 rounded-xl border border-slate-800 flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="text-slate-400 font-semibold">Match against Resume</p>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-transparent text-slate-200 border-none font-bold outline-none cursor-pointer mt-0.5 focus:ring-0 max-w-[180px] truncate"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-950 text-slate-100">{r.fileName}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-850 space-y-5">
            <h2 className="text-sm font-bold text-slate-350 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-slate-800">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Advanced Filters</span>
            </h2>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Software Development">Software Development</option>
                <option value="AI & Data">AI & Data</option>
                <option value="Cloud & Security">Cloud & Security</option>
                <option value="Design">Design</option>
                <option value="Business & Other">Business & Other</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
              <select
                value={selectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Experience Levels</option>
                <option value="Junior / Entry">Junior / Entry</option>
                <option value="Mid-level">Mid-level</option>
                <option value="Senior">Senior</option>
                <option value="Lead / Principal">Lead / Principal</option>
              </select>
            </div>

            {/* Job Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Co-op">Co-op</option>
              </select>
            </div>

            {/* Location / Work Setup */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Setup</label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Locations</option>
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid Only</option>
                <option value="On-site">On-site Only</option>
              </select>
            </div>

            {/* Salary Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salary Tier</label>
              <select
                value={selectedSalary}
                onChange={(e) => setSelectedSalary(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Salaries</option>
                <option value="Low">Low (&lt;$80,000)</option>
                <option value="Medium">Medium ($80,000 - $120,000)</option>
                <option value="High">High (&gt;$120,000)</option>
              </select>
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('All');
                setSelectedExp('All');
                setSelectedType('All');
                setSelectedLoc('All');
                setSelectedSalary('All');
                setSortBy('newest');
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Area: Search, Sort & Job Cards */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search bar & Sorting */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search job title, company name, or programming skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/40 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            {selectedResumeId && (
              <div className="flex bg-slate-900 border border-slate-855 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    sortBy === 'newest' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('matchScore')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                    sortBy === 'matchScore' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Best Match</span>
                </button>
              </div>
            )}
          </div>

          {/* Job listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedJobs.map((job) => {
              const appliedRecord = getApplicationForJob(job.id);
              const score = matchScores[job.id];
              const isFav = favorites.includes(job.id);

              return (
                <div 
                  key={job.id}
                  onClick={() => handleOpenJobDetails(job)}
                  className="glass-panel rounded-2xl p-6 border border-slate-850 hover:border-slate-700/80 transition-all cursor-pointer flex flex-col justify-between gap-5 relative group"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                        {job.department}
                      </span>
                      <h3 className="text-base font-bold text-slate-200 group-hover:text-indigo-400 transition-colors mt-2">{job.title}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{job.company}</p>
                    </div>

                    {/* Heart button */}
                    <button
                      onClick={(e) => handleToggleFavorite(job.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill, index) => (
                      <span key={index} className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-850 text-slate-300 rounded-md font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer Row (Match score or apply details) */}
                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center gap-3">
                    {/* Score display */}
                    {score !== undefined ? (
                      <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${getScoreColor(score)}`}>
                        <Award className="w-3.5 h-3.5" />
                        <span>{score}% Match</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Select resume to match</span>
                    )}

                    {/* Apply actions */}
                    {appliedRecord ? (
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(appliedRecord.status)}`}>
                        {appliedRecord.status}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleApplyClick(job, e)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors group/btn"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedJobs.length === 0 && (
              <div className="col-span-full py-16 text-center glass-panel rounded-2xl">
                <Briefcase className="w-12 h-12 text-slate-655 mx-auto mb-3" />
                <h3 className="font-bold text-slate-400">No Jobs Match Filters</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Try resetting the filters or modifying your query details.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Side Drawer: Detailed Job View & Skill Gap Analysis */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-955/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-2xl h-screen border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto animate-slide-up bg-slate-950">
            <div className="space-y-6 animate-fade-in">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                    {selectedJob.department}
                  </span>
                  <h2 className="text-xl font-bold text-slate-200 mt-2">{selectedJob.title}</h2>
                  <p className="text-xs text-slate-400 font-semibold">{selectedJob.company} • {selectedJob.location}</p>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Match Score Ring (If details loaded) */}
              {selectedJob.matchData && (
                <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 justify-center sm:justify-start">
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span>Skill Compatibility Score</span>
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">Calculated by local key matching parser of required versus extracted skills.</p>
                  </div>
                  
                  <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 shrink-0 ${getScoreColor(selectedJob.matchData.matchScore)}`}>
                    <span className="text-2xl font-extrabold">{selectedJob.matchData.matchScore}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Match</span>
                  </div>
                </div>
              )}

              {/* Job Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-850 bg-slate-900/10 text-xs">
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold">Salary Range</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedJob.salary}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold">Experience Level</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedJob.experienceLevel}</p>
                </div>
                <div>
                  <p className="text-slate-450 uppercase tracking-wider font-bold">Job Type</p>
                  <p className="font-semibold text-slate-200 mt-1">{selectedJob.jobType}</p>
                </div>
                <div>
                  <p className="text-slate-450 uppercase tracking-wider font-bold">Status</p>
                  <p className="font-semibold text-slate-200 mt-1">
                    {getApplicationForJob(selectedJob.id) 
                      ? getApplicationForJob(selectedJob.id).status 
                      : 'Not Applied'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Job Description</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {/* SKILL GAP ANALYSIS */}
              {selectedJob.matchData && (
                <div className="space-y-4 pt-4 border-t border-slate-855">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Skill Gap Analysis & Recommendations</span>
                  </h3>

                  {selectedJob.matchData.missingSkills && selectedJob.matchData.missingSkills.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Based on your resume, the parser identified gaps in key required skills. Follow these learning resources to upgrade:
                      </p>

                      <div className="space-y-3.5">
                        {selectedJob.matchData.skillGaps?.map((gap, i) => (
                          <div key={i} className="p-4 border border-slate-850 bg-slate-900/10 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                                {gap.skill}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Missing Element</span>
                            </div>

                            {/* Suggestions */}
                            <ul className="space-y-1">
                              {gap.suggestions.map((sug, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-indigo-450 rounded-full mt-1.5 shrink-0"></span>
                                  <span>{sug}</span>
                                </li>
                              ))}
                            </ul>

                            {/* Resources */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900 mt-2">
                              {gap.resources.map((res, idx) => (
                                <a
                                  key={idx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>{res.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Congratulations! You possess all required technical skills for this job opening.</span>
                    </div>
                  )}

                  {/* Feedback summary */}
                  <div className="p-4 border border-slate-850 bg-slate-900/10 rounded-xl space-y-1.5 text-xs text-slate-300">
                    <p className="font-semibold text-slate-200">ATS Auditor Commentary</p>
                    <p>{selectedJob.matchData.feedback}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Drawer */}
            <div className="pt-6 border-t border-slate-900 mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900"
              >
                Close Panel
              </button>
              
              {!getApplicationForJob(selectedJob.id) && (
                <button
                  onClick={(e) => handleApplyClick(selectedJob, e)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Apply to Job Opening
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Apply Resume Selector Modal */}
      {showApplyModal && jobToApply && (
        <div className="fixed inset-0 z-50 bg-slate-955/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 bg-slate-950">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-200">Select Application Resume</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 border border-slate-850 rounded-xl bg-slate-900/10 text-xs">
                <span className="text-slate-400 uppercase tracking-wider font-bold">Applying For</span>
                <p className="font-bold text-slate-200 mt-1">{jobToApply.title}</p>
                <p className="text-slate-400">{jobToApply.company} • {jobToApply.location}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Resume File</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-855 rounded-xl px-3 py-3 text-sm focus:outline-none cursor-pointer"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.fileName} (Score: {r.score})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={applying}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                {applying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Applying...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
