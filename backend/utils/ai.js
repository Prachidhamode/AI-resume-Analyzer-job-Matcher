const { GoogleGenAI } = require('@google/generative-ai');

// Extensive list of skills categorized for local fallback parser
const SKILLS_TAXONOMY = {
  technical: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'sql', 'nosql', 'r',
    'html', 'css', 'sass', 'less', 'graphql', 'rest api', 'bash', 'shell', 'powershell', 'perl', 'dart', 'restful apis', 'database indexing'
  ],
  tools: [
    'react', 'angular', 'vue', 'next.js', 'nuxt.js', 'gatsby', 'node.js', 'express', 'django', 'flask', 'fastapi',
    'spring boot', 'laravel', 'rails', 'nestjs', 'jquery', 'bootstrap', 'tailwind', 'redux', 'mobx', 'webpack', 'vite',
    'mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'oracle', 'aws', 'gcp', 'azure', 'docker', 'kubernetes',
    'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'linux', 'nginx', 'apache', 'firebase', 'supabase', 'prisma', 'sequelize',
    'flutter', 'android sdk', 'coroutines', 'terraform', 'selenium', 'jira', 'manual testing', 'automation testing', 'api testing',
    'pytorch', 'tensorflow', 'machine learning', 'data science', 'pandas', 'scikit-learn', 'llms', 'prompt engineering',
    'langchain', 'openai', 'vector db', 'statistics', 'jupyter', 'data visualization', 'excel', 'power bi', 'tableau',
    'nlp', 'hugging face', 'transformers', 'spacy', 'nltk', 'opencv', 'computer vision', 'image processing',
    'cisco', 'tcp/ip', 'routing & switching', 'figma', 'adobe xd', 'adobe photoshop', 'adobe illustrator', 'branding',
    'typography', 'seo', 'google analytics', 'hibernate', 'maven', 'scrum'
  ],
  soft: [
    'communication', 'leadership', 'problem solving', 'teamwork', 'collaboration', 'agile', 'scrum', 'project management',
    'time management', 'analytical', 'critical thinking', 'creativity', 'adaptability', 'decision making', 'negotiation',
    'mentoring', 'public speaking', 'customer service', 'organization', 'business analysis', 'requirements gathering',
    'roadmapping', 'strategy', 'troubleshooting', 'technical support', 'digital marketing', 'social media', 'content creation',
    'copywriting'
  ]
};

// Skill Gap resources mapping
const SKILL_RESOURCES = {
  'react': {
    suggestions: ['Master functional components, custom hooks, and context API.', 'Learn global state managers (e.g. Redux Toolkit, Zustand).'],
    resources: [{ title: 'React Docs', url: 'https://react.dev/' }, { title: 'React Learn Path', url: 'https://scrimba.com/learn/learnreact' }]
  },
  'node.js': {
    suggestions: ['Understand event-driven architecture, non-blocking I/O, and file systems.', 'Practice building servers using Express or NestJS.'],
    resources: [{ title: 'Node.js Learn', url: 'https://nodejs.org/en/learn' }, { title: 'Node.js Tutorial', url: 'https://www.w3schools.com/nodejs/' }]
  },
  'express': {
    suggestions: ['Master middleware integration, route handling, and REST patterns.', 'Learn how to secure routes using JWT and express-validator.'],
    resources: [{ title: 'Express.js Guides', url: 'https://expressjs.com/' }]
  },
  'mongodb': {
    suggestions: ['Learn document schema design, Mongoose integration, and lookup aggregations.', 'Understand indexing to optimize query performance.'],
    resources: [{ title: 'MongoDB Learn', url: 'https://learn.mongodb.com/' }]
  },
  'tailwind': {
    suggestions: ['Learn utility-first responsive layout strategies.', 'Understand configuration of Tailwind themes, plugins, and custom fonts.'],
    resources: [{ title: 'Tailwind CSS Docs', url: 'https://tailwindcss.com/docs' }]
  },
  'typescript': {
    suggestions: ['Implement static checking, interfaces, type assertions, and custom utility types.', 'Configure tsconfig.json options for production compilation.'],
    resources: [{ title: 'TS Handbook', url: 'https://www.typescriptlang.org/docs/' }]
  },
  'javascript': {
    suggestions: ['Understand closures, prototype inheritance, event loop phases, and async patterns.', 'Practice array operations (map, filter, reduce) and fetch APIs.'],
    resources: [{ title: 'MDN JS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }]
  },
  'git': {
    suggestions: ['Master branch workflows, cherry-picking, interactive rebasing, and merge conflict resolution.', 'Practice git hooks and command-line interfaces.'],
    resources: [{ title: 'Git Pro Book', url: 'https://git-scm.com/book/en/v2' }]
  },
  'spring boot': {
    suggestions: ['Master dependency injection, IOC containers, Spring MVC, and REST mapping.', 'Learn database integration with Spring Data JPA and Hibernate.'],
    resources: [{ title: 'Spring Guides', url: 'https://spring.io/guides' }]
  },
  'java': {
    suggestions: ['Understand Object-Oriented Principles, collection APIs, Lambda expressions, and stream processing.', 'Learn about concurrency, memory leaks, and GC tuning.'],
    resources: [{ title: 'Java Documentation', url: 'https://docs.oracle.com/en/java/' }]
  },
  'python': {
    suggestions: ['Practice PEP8 styling, generator functions, decorators, and virtual environment management.', 'Understand file operations and data structures (lists, dicts, sets).'],
    resources: [{ title: 'Python Docs', url: 'https://docs.python.org/3/' }]
  },
  'django': {
    suggestions: ['Learn MVT structure, Django ORM database queries, built-in admin configurations, and templates.', 'Build REST APIs using Django Rest Framework (DRF).'],
    resources: [{ title: 'Django Docs', url: 'https://docs.djangoproject.com/en/' }]
  },
  'docker': {
    suggestions: ['Write multi-stage Dockerfiles to optimize image layers and compile times.', 'Understand container networking, port binding, and Docker Compose orchestration.'],
    resources: [{ title: 'Docker Reference', url: 'https://docs.docker.com/' }]
  },
  'kubernetes': {
    suggestions: ['Learn about Pods, replica controllers, configmaps, services, and ingress deployment.', 'Understand deployment strategies (rolling updates, canary rollouts).'],
    resources: [{ title: 'K8s Learn', url: 'https://kubernetes.io/docs/home/' }]
  },
  'ci/cd': {
    suggestions: ['Configure automated build and test runner scripts inside GitHub Actions or Jenkins.', 'Set up safe environment secrets and automated hosting deployments.'],
    resources: [{ title: 'CI/CD Introduction', url: 'https://www.redhat.com/en/topics/devops/what-is-ci-cd' }]
  },
  'aws': {
    suggestions: ['Understand IAM policies, VPC security, EC2 configurations, S3 buckets, and Lambda scripts.', 'Study AWS Cloud Practitioner or Solutions Architect resources.'],
    resources: [{ title: 'AWS Guides', url: 'https://aws.amazon.com/developer/' }]
  },
  'azure': {
    suggestions: ['Learn cloud essentials: Resource groups, Azure App Service, SQL databases, and Active Directory.', 'Understand virtual network gateways and cloud pricing options.'],
    resources: [{ title: 'Azure Learn', url: 'https://learn.microsoft.com/en-us/azure/' }]
  },
  'sql': {
    suggestions: ['Master complex joins, queries, database indexing, and query profiling.', 'Practice index optimizations and writing nested subqueries.'],
    resources: [{ title: 'SQL Zoo', url: 'https://sqlzoo.net/' }]
  },
  'linux': {
    suggestions: ['Learn directory commands, grep/sed/awk pattern searching, SSH keys, and systemd processes.', 'Write simple bash shell scripts to automate administrative tasks.'],
    resources: [{ title: 'Linux Journey', url: 'https://linuxjourney.com/' }]
  },
  'figma': {
    suggestions: ['Master autolayout grids, reusable component variants, and interactive prototyping.', 'Learn visual hierarchy, responsive design systems, and dev-handoff specs.'],
    resources: [{ title: 'Figma Learn', url: 'https://help.figma.com/hc/en-us/categories/360002051613' }]
  },
  'ui/ux design': {
    suggestions: ['Perform user research, structure wireframes, build high-fidelity designs, and run usability tests.', 'Understand design principles like contrast, proximity, and layout flow.'],
    resources: [{ title: 'UX Collective', url: 'https://uxdesign.cc/' }]
  },
  'seo': {
    suggestions: ['Learn on-page keyword optimization, page-speed improvements, sitemaps, and indexing checks.', 'Monitor analytics using Google Search Console and Google Analytics.'],
    resources: [{ title: 'Google SEO Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' }]
  },
  'flutter': {
    suggestions: ['Understand Widget states, design layout grids, fetch API responses, and run device compilations.', 'Explore state management solutions like Provider, Bloc, or Riverpod.'],
    resources: [{ title: 'Flutter Codelabs', url: 'https://docs.flutter.dev/codelabs' }]
  },
  'kotlin': {
    suggestions: ['Understand null safety structures, extension handlers, coroutines, and functional mapping.', 'Practice writing concise Kotlin solutions for algorithms.'],
    resources: [{ title: 'Kotlin Guides', url: 'https://kotlinlang.org/docs/home.html' }]
  },
  'pytorch': {
    suggestions: ['Build tensor computation maps, configure linear layers, and write standard backpropagation loops.', 'Train models on datasets using GPU acceleration.'],
    resources: [{ title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/' }]
  },
  'tensorflow': {
    suggestions: ['Learn the Keras API structure to compile neural networks, process image datasets, and save graphs.', 'Debug pipelines using TensorBoard tracking.'],
    resources: [{ title: 'TensorFlow Guide', url: 'https://www.tensorflow.org/guide' }]
  },
  'machine learning': {
    suggestions: ['Understand data preprocessing, feature scaling, model selection, and hyperparameters tuning.', 'Master regression, classifications, clusters, and ensemble methods.'],
    resources: [{ title: 'ML Course (Coursera)', url: 'https://www.coursera.org/specializations/machine-learning-introduction' }]
  },
  'llms': {
    suggestions: ['Learn model sizes, fine-tuning mechanisms, contexts windows, and embeddings.', 'Explore API providers (Gemini, OpenAI, Hugging Face).'],
    resources: [{ title: 'Hugging Face Learn', url: 'https://huggingface.co/learn' }]
  },
  'selenium': {
    suggestions: ['Learn browser drivers, DOM element locating strategies, actions, and implicit/explicit waits.', 'Practice page object model (POM) styling and assertions.'],
    resources: [{ title: 'Selenium Docs', url: 'https://www.selenium.dev/documentation/' }]
  },
  'jira': {
    suggestions: ['Learn issue types, workflow transitions, backlog sorting, sprint boards, and filters.', 'Understand epic mappings and progress reports.'],
    resources: [{ title: 'Jira Software Guide', url: 'https://www.atlassian.com/software/jira/guides' }]
  }
};

// Help map missing skills to structured suggestions & resources
function getSkillGapAnalysis(missingSkills) {
  return (missingSkills || []).map(skillName => {
    const lowerSkill = skillName.toLowerCase();
    const mapping = SKILL_RESOURCES[lowerSkill] || {
      suggestions: [`Study the core syntax, terminology, and operational standards of ${skillName}.`, `Create a small demo application using ${skillName} to showcase competence.`],
      resources: [
        { title: `${skillName} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' official documentation')}` }
      ]
    };
    return {
      skill: skillName,
      suggestions: mapping.suggestions,
      resources: mapping.resources
    };
  });
}

// Helper for local regex matching
function extractSkillsLocally(text) {
  const lowercaseText = text.toLowerCase();
  const extracted = {
    technical: [],
    tools: [],
    soft: []
  };

  // Run through taxonomy and match words boundary-safely
  for (const category in SKILLS_TAXONOMY) {
    for (const skill of SKILLS_TAXONOMY[category]) {
      // Escape special regex chars like c++, .net, next.js
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Create word boundary regex. Note: for things like c++, we shouldn't enforce a boundary at the end
      let regexStr = `\\b${escapedSkill}\\b`;
      if (skill.endsWith('+') || skill.endsWith('#')) {
        regexStr = `\\b${escapedSkill}`;
      }
      
      const regex = new RegExp(regexStr, 'i');
      if (regex.test(lowercaseText)) {
        // Format to capitalized/proper case for output
        const formattedSkill = skill.split(' ')
          .map(w => w === 'next.js' ? 'Next.js' : w === 'node.js' ? 'Node.js' : w === 'ci/cd' ? 'CI/CD' : w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        extracted[category].push(formattedSkill);
      }
    }
  }

  return extracted;
}

// Calculate details locally if Gemini is not available
function analyzeLocally(text) {
  const lowercaseText = text.toLowerCase();
  const skills = extractSkillsLocally(text);
  
  // Calculate score based on structure and components
  let score = 20; // Base score for submitting
  
  const structureCheck = {
    experience: false,
    education: false,
    projects: false,
    skills: false,
    contact: false
  };

  // Experience indicators
  if (/experience|work history|employment|career|professional experience/i.test(lowercaseText)) {
    score += 15;
    structureCheck.experience = true;
  }
  // Education indicators
  if (/education|university|college|degree|bachelor|master|phd|diploma/i.test(lowercaseText)) {
    score += 15;
    structureCheck.education = true;
  }
  // Projects indicators
  if (/project|portfolio|personal projects|academic projects/i.test(lowercaseText)) {
    score += 15;
    structureCheck.projects = true;
  }
  // Skills indicators
  if (/skills|technologies|proficiencies|expertise/i.test(lowercaseText)) {
    score += 15;
    structureCheck.skills = true;
  }
  // Contact indicators
  if (/@|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|phone|email|linkedin|github\.com/i.test(lowercaseText)) {
    score += 10;
    structureCheck.contact = true;
  }
  // Length contribution
  if (text.length > 800) {
    score += 10;
  }

  // Cap score at 95 for local fallback (to save room for improvement feedback)
  score = Math.min(score, 95);

  // Generate feedback
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  // Evaluate structure
  if (structureCheck.experience) strengths.push('Includes professional work experience section.');
  else weaknesses.push('Missing professional work experience section.');

  if (structureCheck.education) strengths.push('Includes educational qualifications.');
  else weaknesses.push('Missing educational history section.');

  if (structureCheck.projects) strengths.push('Showcases personal or academic projects.');
  else weaknesses.push('Missing project work. Adding projects showcases applied knowledge.');

  if (structureCheck.skills) strengths.push('Has a dedicated skills section.');
  else weaknesses.push('Lacks a clear, dedicated skills section.');

  // Evaluate skills density
  const totalSkillsCount = skills.technical.length + skills.tools.length + skills.soft.length;
  if (totalSkillsCount >= 10) {
    strengths.push(`Rich keyword diversity with ${totalSkillsCount} identified skills.`);
  } else if (totalSkillsCount < 5) {
    weaknesses.push('Low keyword/skill density. Modern ATS scanning systems may filter your resume out.');
    recommendations.push('Add specific tools, frameworks, and programming languages you have used.');
  }

  if (skills.soft.length === 0) {
    weaknesses.push('Lacks soft skills keywords.');
    recommendations.push('Include soft skills (e.g. Collaboration, Problem Solving, Agile) in the context of your achievements.');
  } else {
    strengths.push('Highlights valuable soft/collaborative skills.');
  }

  // Standard recommendations
  recommendations.push('Use action verbs (e.g., Developed, Led, Optimized) at the start of bullet points.');
  recommendations.push('Ensure your contact details (LinkedIn, GitHub, Portfolio) are clickable links.');
  if (text.length < 500) {
    recommendations.push('Expand your resume content. A standard 1-page resume should contain around 400-600 words.');
  }

  // Parse dummy work experience & education lists
  const workHistory = [];
  const education = [];

  // Basic regex parser for experience items
  const expMatches = [...text.matchAll(/(?:experience|work history|employment|career)[^]*?(?=education|projects|skills|languages|$)/gi)];
  if (expMatches.length > 0) {
    const expText = expMatches[0][0];
    const lines = expText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    // Take the first 3 lines as representative details
    lines.slice(1, 4).forEach((line, i) => {
      workHistory.push({
        role: line.substring(0, 40) + (line.length > 40 ? '...' : ''),
        company: 'Company ' + (i + 1),
        duration: 'Parsed from Text',
        description: line
      });
    });
  }

  if (workHistory.length === 0) {
    workHistory.push({
      role: 'Software Developer (Example)',
      company: 'Sample Organization',
      duration: '2023 - Present',
      description: 'Worked on full-stack web applications, wrote APIs, and managed databases.'
    });
  }

  // Basic regex parser for education items
  const eduMatches = [...text.matchAll(/(?:education)[^]*?(?=experience|projects|skills|languages|$)/gi)];
  if (eduMatches.length > 0) {
    const eduText = eduMatches[0][0];
    const lines = eduText.split('\n').map(l => l.trim()).filter(l => l.length > 8);
    lines.slice(1, 3).forEach(line => {
      education.push({
        degree: line.substring(0, 50),
        school: 'Institution Name',
        year: 'Parsed'
      });
    });
  }

  if (education.length === 0) {
    education.push({
      degree: 'Bachelor of Science in Computer Science (Example)',
      school: 'State University',
      year: 'Graduated 2024'
    });
  }

  return {
    score,
    skills,
    workHistory,
    education,
    strengths,
    weaknesses,
    recommendations,
    analysisType: 'Local NLP Fallback Engine'
  };
}

// Main analysis function
async function analyzeResume(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY not found in env. Falling back to local NLP engine.');
    return analyzeLocally(text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert ATS (Applicant Tracking System) recruiter and resume optimization AI.
Analyze the following resume text and return a structured JSON response evaluating it.
You MUST output strictly in JSON format matching the schema below. No other text or markdown code blocks should surround the JSON.

JSON Schema to return:
{
  "score": <integer, 0 to 100 representing resume strength>,
  "skills": {
    "technical": [<string, programming languages, databases, cloud, etc.>],
    "tools": [<string, libraries, frameworks, developer tools, version control, IDEs, etc.>],
    "soft": [<string, communication, team-work, leadership, methodologies like agile/scrum>]
  },
  "workHistory": [
    {
      "role": "<string>",
      "company": "<string>",
      "duration": "<string>",
      "description": "<string>"
    }
  ],
  "education": [
    {
      "degree": "<string>",
      "school": "<string>",
      "year": "<string>"
    }
  ],
  "strengths": [<string, bullet point list of resume strengths>],
  "weaknesses": [<string, bullet point list of weaknesses / gaps>],
  "recommendations": [<string, actionable resume improvements>]
}

Resume Text:
"""
${text}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    const parsedData = JSON.parse(responseText);
    parsedData.analysisType = 'Gemini AI Engine';
    return parsedData;

  } catch (error) {
    console.error('Gemini API analysis failed. Falling back to local NLP engine.', error);
    return {
      ...analyzeLocally(text),
      analysisError: error.message
    };
  }
}

// Job matching utility
async function matchJob(resumeText, jobDescription) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Local Matcher: Calculate overlap of skills extracted from both texts
    const resumeSkillsObj = extractSkillsLocally(resumeText);
    const jobSkillsObj = extractSkillsLocally(jobDescription);

    const resumeSkills = [
      ...resumeSkillsObj.technical,
      ...resumeSkillsObj.tools,
      ...resumeSkillsObj.soft
    ].map(s => s.toLowerCase());

    const jobSkills = [
      ...jobSkillsObj.technical,
      ...jobSkillsObj.tools,
      ...jobSkillsObj.soft
    ].map(s => s.toLowerCase());

    if (jobSkills.length === 0) {
      // Return a base match if no skills detected in job description
      return {
        matchScore: 60,
        matchedSkills: [],
        missingSkills: [],
        skillGaps: [],
        feedback: 'Calculated using local keyword match. The job description has generic wording, consider adding more technical terms.',
        interviewTips: ['Prepare to explain how your past projects match their core role requirements.', 'Be ready to describe your coding workflow and tool choices.']
      };
    }

    const matched = jobSkills.filter(skill => resumeSkills.includes(skill));
    const missing = jobSkills.filter(skill => !resumeSkills.includes(skill));
    
    // Percentage overlap
    const score = Math.round((matched.length / jobSkills.length) * 100);
    const finalScore = Math.max(30, Math.min(score, 98)); // bound between 30 and 98

    // Capitalize skills helper
    const cap = (arr) => arr.map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

    const capitalizedMissing = cap(missing);
    return {
      matchScore: finalScore,
      matchedSkills: cap(matched),
      missingSkills: capitalizedMissing,
      skillGaps: getSkillGapAnalysis(capitalizedMissing),
      feedback: `Local Analysis: Matches ${matched.length} out of ${jobSkills.length} key skills extracted from the job description. Gaps identified in: ${missing.length > 0 ? cap(missing).join(', ') : 'None'}.`,
      interviewTips: [
        `Review the missing skills: ${cap(missing).slice(0, 3).join(', ') || 'N/A'}. Be prepared to explain how you can learn or compensate for them.`,
        'Highlight your strength in these matched skills: ' + cap(matched).slice(0, 4).join(', ') + '.'
      ],
      analysisType: 'Local Keyword Matching'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an AI Recruitment Bot. Compare the following resume text against the job description.
Calculate the compatibility match score (0 to 100%) and identify matched skills, missing skills, general feedback, and interview preparation tips.
You MUST output strictly in JSON format matching the schema below. No other text or markdown code blocks should surround the JSON.

JSON Schema:
{
  "matchScore": <integer between 0 and 100>,
  "matchedSkills": [<string, skills found in both resume and job description>],
  "missingSkills": [<string, key skills required in job description but missing/weak in resume>],
  "feedback": "<string, detailed breakdown of why they fit or what is lacking>",
  "interviewTips": [<string, specific preparation tips based on resume gaps and job requirements>]
}

Resume Text:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    parsed.analysisType = 'Gemini AI Matching';
    parsed.skillGaps = getSkillGapAnalysis(parsed.missingSkills);
    return parsed;
  } catch (error) {
    console.error('Gemini job matching failed. Falling back to local keyword matcher.', error);
    // Simple recursive call using the local pathway by temporarily omitting apiKey
    const resumeSkillsObj = extractSkillsLocally(resumeText);
    const jobSkillsObj = extractSkillsLocally(jobDescription);

    const resumeSkills = [
      ...resumeSkillsObj.technical,
      ...resumeSkillsObj.tools,
      ...resumeSkillsObj.soft
    ].map(s => s.toLowerCase());

    const jobSkills = [
      ...jobSkillsObj.technical,
      ...jobSkillsObj.tools,
      ...jobSkillsObj.soft
    ].map(s => s.toLowerCase());

    const matched = jobSkills.filter(skill => resumeSkills.includes(skill));
    const missing = jobSkills.filter(skill => !resumeSkills.includes(skill));
    const score = Math.round((matched.length / Math.max(1, jobSkills.length)) * 105);
    const capitalizedMissing = missing.map(s => s.toUpperCase());
    
    return {
      matchScore: Math.max(30, Math.min(score, 95)),
      matchedSkills: matched.map(s => s.toUpperCase()),
      missingSkills: capitalizedMissing,
      skillGaps: getSkillGapAnalysis(capitalizedMissing),
      feedback: 'Failed to query Gemini API. Computed using fallback keyword intersection.',
      interviewTips: ['Practice explaining your core development experience.', 'Be prepared to discuss your work history in detail.'],
      analysisType: 'Local Keyword Matching (API Error)'
    };
  }
}

module.exports = {
  analyzeResume,
  matchJob,
  extractSkillsLocally
};
