import React, { useState, useRef } from 'react';
import { api } from '../utils/api';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage({ onNavigate, onViewResume, showNotification }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState(''); // E.g., 'Reading PDF file...', 'Extracting skills...'
  const fileInputRef = useRef(null);

  // Developer Profiles and Coding Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [codechefUrl, setCodechefUrl] = useState('');
  const [hackerrankUrl, setHackerrankUrl] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      showNotification('Only PDF files are supported.', 'error');
      return;
    }
    // Limit to 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      showNotification('File is too large. Max size is 5MB.', 'error');
      return;
    }
    setFile(selectedFile);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!githubUrl.trim()) {
      showNotification('GitHub link is required to parse and map your profile.', 'error');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlPattern.test(githubUrl.trim())) {
      showNotification('Please enter a valid GitHub URL.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('githubUrl', githubUrl.trim());
    formData.append('linkedinUrl', linkedinUrl.trim());
    formData.append('leetcodeUrl', leetcodeUrl.trim());
    formData.append('codechefUrl', codechefUrl.trim());
    formData.append('hackerrankUrl', hackerrankUrl.trim());

    try {
      setUploading(true);
      setProgressStatus('Reading PDF file structure...');
      
      // Simulate status progression for premium feel
      const stages = [
        { text: 'Extracting plain text layout...', delay: 1200 },
        { text: 'Running AI skill extraction engine...', delay: 2400 },
        { text: 'Computing ATS compliance score...', delay: 3800 }
      ];

      stages.forEach(stage => {
        setTimeout(() => {
          if (uploading) {
            setProgressStatus(stage.text);
          }
        }, stage.delay);
      });

      const response = await api.post('/resumes/upload', formData);
      setProgressStatus('Resume analyzed successfully!');
      showNotification('Resume parsed and saved successfully!', 'success');
      
      // Redirect to detail page
      setTimeout(() => {
        onViewResume(response.id);
      }, 1000);
      
    } catch (err) {
      showNotification(err.message || 'Failed to upload and parse resume', 'error');
      setUploading(false);
      setProgressStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Upload Your <span className="gradient-text">PDF Resume</span>
        </h1>
        <p className="text-slate-400">
          Our parser will extract skills, evaluate formatting, and score your compliance.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 space-y-6 border border-slate-800">
        
        {/* Drag and Drop Zone */}
        {!file && !uploading && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 group ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/5 hover:bg-slate-900/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleChange}
            />
            
            <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 group-hover:scale-110 transition-all duration-300">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-200">Drag & drop your resume file here</p>
              <p className="text-xs text-slate-400">or click to browse from files</p>
            </div>
            
            <div className="text-slate-500 text-[11px] font-medium pt-2">
              Supports: PDF (Maximum size 5MB)
            </div>
          </div>
        )}

        {/* Selected file state */}
        {file && !uploading && (
          <div className="p-6 border border-slate-800 bg-slate-900/10 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Uploading progress state */}
        {uploading && (
          <div className="p-8 border border-indigo-500/20 bg-indigo-500/5 rounded-xl space-y-6 flex flex-col items-center justify-center text-center">
            {progressStatus.includes('successfully') ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse-slow" />
            ) : (
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="font-semibold text-slate-200">{progressStatus}</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Parsing structures, resolving key matches and running structural score calculations.
              </p>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-1.5 rounded-full animate-pulse-slow w-[75%] transition-all duration-1000"></div>
            </div>
          </div>
        )}

        {/* Developer Links Input Fields */}
        {!uploading && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <span>Developer & Professional Links</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">GitHub Link *</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">LinkedIn Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">LeetCode Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/username"
                  value={leetcodeUrl}
                  onChange={(e) => setLeetcodeUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">CodeChef Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://codechef.com/users/username"
                  value={codechefUrl}
                  onChange={(e) => setCodechefUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">HackerRank Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://hackerrank.com/username"
                  value={hackerrankUrl}
                  onChange={(e) => setHackerrankUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons footer */}
        {file && !uploading && (
          <div className="flex gap-4">
            <button
              onClick={() => setFile(null)}
              className="flex-1 py-3 border border-slate-800 hover:bg-slate-900/40 text-slate-300 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Analyze Resume
            </button>
          </div>
        )}
      </div>

      {/* Tip panel */}
      <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Tips for best analysis results:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Ensure the file is not scanned/image-only. Our parser requires readable textual layout.</li>
            <li>Double-check contact details and structure. Headings like "Experience" or "Education" help the parser.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
