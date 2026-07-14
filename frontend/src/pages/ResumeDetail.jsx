import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  ArrowLeft, 
  FileText, 
  Award, 
  Compass, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Briefcase, 
  GraduationCap, 
  Activity,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function ResumeDetail({ resumeId, onBack, onNavigate, showNotification }) {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [jobMatches, setJobMatches] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchResumeDetails();
    }
  }, [resumeId]);

  const fetchResumeDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/resumes/${resumeId}`);
      setResume(data);
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve resume details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobMatches = async () => {
    if (!resume) return;
    try {
      setMatchingLoading(true);
      const jobs = await api.get('/jobs');
      
      const matchPromises = jobs.map(job => 
        api.get(`/jobs/${job.id}/match/${resume.id}`)
          .catch(() => ({ 
            jobTitle: job.title, 
            company: job.company, 
            matchScore: 0, 
            feedback: 'Match compilation failed.' 
          }))
      );
      
      const results = await Promise.all(matchPromises);
      setJobMatches(results.sort((a, b) => b.matchScore - a.matchScore));
    } catch (err) {
      showNotification('Failed to execute job matches', 'error');
    } finally {
      setMatchingLoading(false);
    }
  };

  // Trigger matches automatically when entering 'matching' tab
  useEffect(() => {
    if (activeTab === 'matching' && jobMatches.length === 0 && resume) {
      fetchJobMatches();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Retrieving parsing results...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-12 glass-panel rounded-2xl max-w-xl mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold">Resume Not Found</h2>
        <p className="text-slate-400">The resume could not be retrieved. It may have been deleted.</p>
        <button onClick={onBack} className="text-indigo-400 font-semibold flex items-center gap-1 mx-auto hover:underline">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const { parsedData } = resume;
  const score = parsedData.score || 0;
  const skills = parsedData.skills || { technical: [], tools: [], soft: [] };

  // Prepare chart data
  const chartData = [
    { name: 'Technical', count: skills.technical?.length || 0, color: '#6366f1' },
    { name: 'Frameworks/Tools', count: skills.tools?.length || 0, color: '#06b6d4' },
    { name: 'Soft Skills', count: skills.soft?.length || 0, color: '#10b981' }
  ];

  // Radial Score Ring Parameters
  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreBadgeColor = (val) => {
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Profile Overview Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
        <div className="flex items-center gap-4 min-w-0 self-start md:self-center">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-100 truncate">{resume.fileName}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-indigo-400">Engine:</span>
              <span>{parsedData.analysisType || 'Local Fallback'}</span>
            </p>

            {/* Developer/Social Links Row */}
            <div className="flex flex-wrap gap-2 mt-3.5">
              {resume.githubUrl && (
                <a
                  href={resume.githubUrl.startsWith('http') ? resume.githubUrl : `https://${resume.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <GithubIcon className="w-3.5 h-3.5 text-indigo-450" />
                  <span>GitHub</span>
                </a>
              )}
              {resume.linkedinUrl && (
                <a
                  href={resume.linkedinUrl.startsWith('http') ? resume.linkedinUrl : `https://${resume.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <LinkedinIcon className="w-3.5 h-3.5 text-cyan-450" />
                  <span>LinkedIn</span>
                </a>
              )}
              {resume.leetcodeUrl && (
                <a
                  href={resume.leetcodeUrl.startsWith('http') ? resume.leetcodeUrl : `https://${resume.leetcodeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-450" />
                  <span>LeetCode</span>
                </a>
              )}
              {resume.codechefUrl && (
                <a
                  href={resume.codechefUrl.startsWith('http') ? resume.codechefUrl : `https://${resume.codechefUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-450" />
                  <span>CodeChef</span>
                </a>
              )}
              {resume.hackerrankUrl && (
                <a
                  href={resume.hackerrankUrl.startsWith('http') ? resume.hackerrankUrl : `https://${resume.hackerrankUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-450" />
                  <span>HackerRank</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Score Dial */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative flex items-center justify-center w-[120px] h-[120px]">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-slate-900"
                strokeWidth={stroke}
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx="60"
                cy="60"
              />
              <circle
                className={`transition-all duration-1000 ease-out`}
                stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e'}
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                fill="transparent"
                r={normalizedRadius}
                cx="60"
                cy="60"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold">{score}</span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ATS Score</p>
            </div>
          </div>

          <div className="space-y-1">
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${getScoreBadgeColor(score)}`}>
              {score >= 80 ? 'ATS Compliant' : score >= 60 ? 'Needs Tweaks' : 'Low Compliance'}
            </span>
            <p className="text-xs text-slate-400 max-w-[180px]">
              {score >= 80 
                ? 'Excellent structure. Resume matches typical recruitment benchmarks.' 
                : score >= 60 
                  ? 'Decent layout. Missing a few key structural elements or skills.' 
                  : 'Requires improvements. Check recommendations to boost your score.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-4 scrollbar-none">
        {[
          { id: 'overview', label: 'Analysis & Charts', icon: Compass },
          { id: 'skills', label: 'Skills Inventory', icon: Award },
          { id: 'experience', label: 'Work & Education', icon: Briefcase },
          { id: 'recommendations', label: 'Feedback & Tips', icon: HelpCircle },
          { id: 'matching', label: 'Job Matching', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all outline-none ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* Panel 1: Overview & Charts */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200">Extracted Skills Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelClassName="text-slate-400 font-bold"
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between gap-6">
              <h3 className="font-bold text-slate-200">Structural Audits</h3>
              
              <div className="space-y-4 flex-1">
                {[
                  { label: 'Work History', check: parsedData.workHistory?.length > 0 },
                  { label: 'Education', check: parsedData.education?.length > 0 },
                  { label: 'Skills Section', check: (skills.technical?.length + skills.tools?.length) > 0 },
                  { label: 'Soft Skills Info', check: skills.soft?.length > 0 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-850">
                    <span className="text-sm font-medium text-slate-300">{item.label}</span>
                    {item.check ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PASSED</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">MISSING</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 text-center font-medium">
                Analysis completed locally by parser framework
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Skills Inventory */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Technical Skills', list: skills.technical, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { title: 'Frameworks & Tools', list: skills.tools, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { title: 'Soft Skills', list: skills.soft, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
            ].map((cat, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="font-bold text-slate-200 border-b border-slate-850 pb-2">{cat.title}</h3>
                {cat.list && cat.list.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cat.list.map((skill, index) => (
                      <span key={index} className={`text-xs font-semibold px-3 py-1 rounded-lg border ${cat.color}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No skills identified in this category.</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Panel 3: Work & Education */}
        {activeTab === 'experience' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Experience timeline */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Work History</span>
              </h3>
              
              <div className="space-y-6 relative pl-4 border-l border-slate-800">
                {parsedData.workHistory && parsedData.workHistory.length > 0 ? (
                  parsedData.workHistory.map((work, index) => (
                    <div key={index} className="relative space-y-2">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-950"></span>
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm sm:text-base">{work.role}</h4>
                          <p className="text-xs text-slate-400">{work.company}</p>
                        </div>
                        <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">{work.duration}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{work.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No work history extracted.</p>
                )}
              </div>
            </div>

            {/* Education timeline */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <span>Education</span>
              </h3>
              
              <div className="space-y-6 relative pl-4 border-l border-slate-800">
                {parsedData.education && parsedData.education.length > 0 ? (
                  parsedData.education.map((edu, index) => (
                    <div key={index} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-slate-950"></span>
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm sm:text-base">{edu.degree}</h4>
                          <p className="text-xs text-slate-400">{edu.school}</p>
                        </div>
                        <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">{edu.year}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No education history extracted.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: Feedback & Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Strengths */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Identified Strengths</span>
              </h3>
              {parsedData.strengths && parsedData.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {parsedData.strengths.map((str, index) => (
                    <li key={index} className="text-xs text-slate-350 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific strengths categorized.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Areas of Improvement</span>
              </h3>
              {parsedData.weaknesses && parsedData.weaknesses.length > 0 ? (
                <ul className="space-y-3">
                  {parsedData.weaknesses.map((weak, index) => (
                    <li key={index} className="text-xs text-slate-350 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-450 italic">Excellent! No major structural weaknesses detected.</p>
              )}
            </div>

            {/* Action Recommendations */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-indigo-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Compass className="w-4 h-4" />
                <span>Recommendations</span>
              </h3>
              {parsedData.recommendations && parsedData.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {parsedData.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-slate-350 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5"></span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No recommendations needed.</p>
              )}
            </div>
          </div>
        )}

        {/* Panel 5: Job Matching */}
        {activeTab === 'matching' && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="font-bold text-slate-200">Matching Directory</h3>
                <p className="text-xs text-slate-400">Match this resume against your system's target job profiles.</p>
              </div>
              <button
                onClick={fetchJobMatches}
                disabled={matchingLoading}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-850 hover:bg-slate-900 rounded-lg text-slate-300 disabled:opacity-50"
              >
                {matchingLoading ? 'Re-matching...' : 'Force Refresh Matches'}
              </button>
            </div>

            {matchingLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 mt-3">Evaluating job skill overlapping profiles...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobMatches.map((match, index) => (
                  <div 
                    key={index} 
                    className="p-5 border border-slate-800/80 bg-slate-900/10 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{match.jobTitle}</h4>
                      <p className="text-xs text-slate-400">{match.company} • Matches skills overlap</p>
                      <p className="text-xs text-slate-500 leading-normal line-clamp-1 max-w-lg">{match.feedback}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-extrabold ${
                            match.matchScore >= 80 ? 'text-emerald-400' : match.matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {match.matchScore}% Match
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overlap Score</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          localStorage.setItem('selectedResumeId', resume.id);
                          localStorage.setItem('selectedJobId', match.jobId);
                          onNavigate('matcher');
                        }}
                        className="p-2 bg-slate-850 hover:bg-indigo-500 text-slate-300 hover:text-white rounded-lg transition-all"
                        title="View detailed breakdown"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {jobMatches.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs italic">
                    Initiating job catalog match rate...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
