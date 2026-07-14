require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');

const db = require('./utils/db');
const { analyzeResume, matchJob } = require('./utils/ai');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*', // Allow connection from development client
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Set up directory for temp uploads
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'), false);
    }
  }
});

// Seed Jobs Collection if empty
async function seedJobs() {
  const currentJobs = await db.find('jobs');
  if (currentJobs.length < 25) {
    // Clear existing jobs to prevent duplicate mismatches
    const existing = await db.find('jobs');
    for (const job of existing) {
      await db.delete('jobs', { id: job.id });
    }

    const seedData = [
      // Software Development (8 roles)
      {
        title: 'Frontend React Developer',
        company: 'WebSphere Solutions',
        location: 'Remote, USA',
        salary: '$85,000 - $115,000',
        description: 'We are looking for a passionate Frontend Engineer. You will build and optimize user-facing features using React, Tailwind CSS, JavaScript, and TypeScript. Experience working with Git, Redux, and integrating with RESTful APIs is required.',
        requiredSkills: ['React', 'Tailwind', 'JavaScript', 'TypeScript', 'Git', 'HTML', 'CSS', 'REST API'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },
      {
        title: 'Backend Java Developer (Spring Boot)',
        company: 'FinTech Global Group',
        location: 'New York, NY (Hybrid)',
        salary: '$110,000 - $140,000',
        description: 'Join our banking solutions squad. You will write backend APIs in Java and Spring Boot, integrating with Hibernate databases, SQL query engines, and Maven builders. Designing secure REST endpoints is key.',
        requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Hibernate', 'REST API', 'Git', 'Maven'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'Software Development'
      },
      {
        title: 'Full Stack MERN Developer',
        company: 'StackLabs Inc.',
        location: 'San Francisco, CA (Hybrid)',
        salary: '$95,000 - $130,000',
        description: 'Develop and deploy customer portal features. You will code responsive pages in React and Tailwind, write microservices in Node.js and Express, and design schemas in MongoDB database.',
        requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Tailwind', 'Git', 'REST API'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },
      {
        title: 'Python Django Developer',
        company: 'Pyramid Digital Systems',
        location: 'Austin, TX',
        salary: '$90,000 - $120,000',
        description: 'Maintain robust web applications. Must be highly skilled in Python and Django MVC structure. Familiarity with Django REST Framework, Docker environments, and SQL databases is desired.',
        requiredSkills: ['Python', 'Django', 'SQL', 'REST API', 'Git', 'Docker', 'HTML', 'CSS'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },
      {
        title: 'Flutter Mobile Developer',
        company: 'AppForge Studios',
        location: 'Remote',
        salary: '$80,000 - $110,000',
        description: 'Help build cross-platform mobile apps for iOS and Android. Requires extensive knowledge of Dart and Flutter. Experience in state management, connecting RESTful APIs, and deploying mobile products.',
        requiredSkills: ['Dart', 'Flutter', 'Git', 'REST API', 'Firebase', 'State Management'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },
      {
        title: 'Android Developer (Kotlin)',
        company: 'PixelPath Mobile Solutions',
        location: 'Chicago, IL',
        salary: '$100,000 - $135,000',
        description: 'Write high-performance native Android applications. Must have strong skills in Kotlin, Android SDK, and coroutines. Experience with SQLite and Firebase integration is highly preferred.',
        requiredSkills: ['Kotlin', 'Android SDK', 'Java', 'Git', 'REST API', 'Firebase', 'Coroutines'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },
      {
        title: 'DevOps Engineer',
        company: 'Skyward Cloud Systems',
        location: 'Remote, USA',
        salary: '$120,000 - $160,000',
        description: 'Architect, scale, and secure our multi-cloud CI/CD pipeline infrastructure. Required expertise in Docker containerization, Kubernetes orchestration, Terraform, AWS services, and Linux systems administration.',
        requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Jenkins', 'Linux', 'Terraform', 'Bash'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'Software Development'
      },
      {
        title: 'Software Test Engineer (QA)',
        company: 'QualiTest Solutions',
        location: 'Denver, CO (Hybrid)',
        salary: '$75,000 - $95,000',
        description: 'Formulate, code, and execute end-to-end regression test suites. Skilled in manual verification and automation tools like Selenium. Competence in Python scripting and Jira tracking.',
        requiredSkills: ['Selenium', 'Java', 'Python', 'Jira', 'Git', 'Manual Testing', 'Automation Testing', 'API Testing'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Software Development'
      },

      // AI & Data (6 roles)
      {
        title: 'AI/ML Engineer',
        company: 'NeuralScale AI Laboratories',
        location: 'San Francisco, CA',
        salary: '$140,000 - $185,000',
        description: 'Train and deploy custom machine learning algorithms for predictive user modeling. Strong commands in Python, PyTorch or TensorFlow, SQL querying, and pandas/scikit-learn.',
        requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'SQL', 'Machine Learning', 'Data Science', 'Pandas', 'Scikit-learn'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'AI & Data'
      },
      {
        title: 'Generative AI Engineer',
        company: 'Synthetix Labs',
        location: 'Remote',
        salary: '$130,000 - $175,000',
        description: 'Design LLM-powered applications, chatbots, and agents. Skilled in Python, prompt engineering, LangChain, and OpenAI/Gemini SDKs. Experienced with vector databases.',
        requiredSkills: ['Python', 'PyTorch', 'LLMs', 'Prompt Engineering', 'LangChain', 'OpenAI', 'Vector DB', 'Git'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'AI & Data'
      },
      {
        title: 'Data Scientist',
        company: 'Insights Analytics Corp',
        location: 'Boston, MA',
        salary: '$115,000 - $150,000',
        description: 'Analyze complex business datasets to uncover growth trends. Strong mathematical foundations in statistics and probability. Skilled in Python, R, SQL, and pandas.',
        requiredSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'Jupyter', 'Data Visualization'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'AI & Data'
      },
      {
        title: 'Data Analyst',
        company: 'DataFlow Consultants',
        location: 'Seattle, WA',
        salary: '$80,000 - $105,000',
        description: 'Translate raw sales and usage metrics into functional stakeholder dashboards. Expert in writing clean SQL, advanced Excel processing, and building visualizations in Power BI or Tableau.',
        requiredSkills: ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Data Analysis', 'Statistics'],
        jobType: 'Full-time',
        experienceLevel: 'Junior / Entry',
        department: 'AI & Data'
      },
      {
        title: 'NLP Engineer',
        company: 'LinguaTech AI Solutions',
        location: 'Seattle, WA (Hybrid)',
        salary: '$135,000 - $170,000',
        description: 'Develop neural parsing engines for entity recognition and summarization. Requires Python, Spacy, NLTK, Hugging Face transformers, and PyTorch model fine-tuning.',
        requiredSkills: ['Python', 'NLP', 'PyTorch', 'Hugging Face', 'Transformers', 'Spacy', 'NLTK', 'Git'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'AI & Data'
      },
      {
        title: 'Computer Vision Engineer',
        company: 'OmniEye Robotics',
        location: 'Pittsburgh, PA',
        salary: '$130,000 - $170,000',
        description: 'Implement visual processing networks for autonomous robotic systems. Proficient in OpenCV image filtering, PyTorch/TensorFlow convolution networks, and writing clean C++ logic.',
        requiredSkills: ['Python', 'OpenCV', 'PyTorch', 'TensorFlow', 'Computer Vision', 'C++', 'Image Processing'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'AI & Data'
      },

      // Cloud & Security (4 roles)
      {
        title: 'Cloud Engineer (AWS/Azure)',
        company: 'Apex Cloud Services',
        location: 'Denver, CO',
        salary: '$110,000 - $145,000',
        description: 'Build and deploy scalable hosting platforms on AWS and Azure. Set up secure VPC networks, Docker environments, and automate infrastructure deployments using Terraform.',
        requiredSkills: ['AWS', 'Azure', 'Linux', 'Docker', 'Terraform', 'Network Security', 'CI/CD'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Cloud & Security'
      },
      {
        title: 'Cybersecurity Analyst',
        company: 'Sentinel Cyber Guard',
        location: 'Washington, DC',
        salary: '$95,000 - $125,000',
        description: 'Monitor, analyze, and mitigate active network security threats. Understand firewall configurations, SIEM log analyses, penetration testing strategies, and incident response guidelines.',
        requiredSkills: ['Network Security', 'Cybersecurity', 'Linux', 'Firewalls', 'SIEM', 'Penetration Testing', 'Incident Response'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Cloud & Security'
      },
      {
        title: 'Cloud Security Engineer',
        company: 'ShieldCloud Solutions',
        location: 'Remote',
        salary: '$125,000 - $160,000',
        description: 'Enforce security boundaries for Kubernetes cloud clusters. Configure IAM roles, scan Docker container vulnerabilities, and setup automated threat mitigations.',
        requiredSkills: ['AWS', 'Azure', 'Cloud Security', 'Kubernetes', 'IAM', 'Docker', 'Network Security'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'Cloud & Security'
      },
      {
        title: 'Network Engineer',
        company: 'CoreConnect Networks',
        location: 'Philadelphia, PA',
        salary: '$90,000 - $115,000',
        description: 'Configure and maintain hardware routing and switching tables. Skilled in Cisco CLI, firewall operations, TCP/IP configurations, and Linux server management.',
        requiredSkills: ['Network Administration', 'Cisco', 'TCP/IP', 'Linux', 'Firewalls', 'Routing & Switching'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Cloud & Security'
      },

      // Design (3 roles)
      {
        title: 'UI/UX Designer',
        company: 'Vivid Studio',
        location: 'Remote (Hybrid)',
        salary: '$85,000 - $115,000',
        description: 'Create wireframes, high-fidelity mockups, and interactive prototypes in Figma and Adobe XD. Drive user research initiatives and translate feedback into sleek visual flows.',
        requiredSkills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Adobe XD'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Design'
      },
      {
        title: 'Product Designer',
        company: 'Nova Innovate',
        location: 'Remote, UK',
        salary: '$90,000 - $125,000',
        description: 'Collaborate with engineering teams to shape user experiences from concept to release. Design autolayout design systems in Figma and build user-centric visual components.',
        requiredSkills: ['Figma', 'Product Design', 'UI/UX Design', 'User Research', 'Prototyping', 'Collaboration'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Design'
      },
      {
        title: 'Graphic Designer',
        company: 'BrandCraft Agency',
        location: 'Chicago, IL',
        salary: '$60,000 - $80,000',
        description: 'Formulate striking branding visual systems, typography styles, and promotional collateral. Expert in Adobe Photoshop, Adobe Illustrator, and creative graphic workflows.',
        requiredSkills: ['Adobe Photoshop', 'Adobe Illustrator', 'Graphic Design', 'Branding', 'Typography', 'Creativity'],
        jobType: 'Full-time',
        experienceLevel: 'Junior / Entry',
        department: 'Design'
      },

      // Business & Other (4 roles)
      {
        title: 'Business Analyst',
        company: 'FinConsult Group',
        location: 'New York, NY',
        salary: '$85,000 - $110,000',
        description: 'Gather user requirements, draft feature specifications, and write Agile user stories in Jira. Analyze system processes using basic SQL and compile stakeholder summaries.',
        requiredSkills: ['Business Analysis', 'SQL', 'Excel', 'Jira', 'Agile', 'Requirements Gathering', 'Communication'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Business & Other'
      },
      {
        title: 'Product Manager',
        company: 'Productly SaaS',
        location: 'San Jose, CA (Hybrid)',
        salary: '$120,000 - $155,000',
        description: 'Define the strategic vision and roadmap for client portals. Coordinate developers and designers using Agile Scrum boards. Solid sprints mapping and Jira monitoring experience.',
        requiredSkills: ['Product Management', 'Agile', 'Scrum', 'Jira', 'Roadmapping', 'Strategy', 'Communication'],
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        department: 'Business & Other'
      },
      {
        title: 'Technical Support Engineer',
        company: 'CloudServe Tech',
        location: 'Atlanta, GA',
        salary: '$65,000 - $85,000',
        description: 'Investigate and resolve complex client database queries and technical issues. Skilled in CLI bash navigation, writing SQL queries, and offering professional customer support.',
        requiredSkills: ['Linux', 'SQL', 'Troubleshooting', 'Technical Support', 'Customer Service', 'Communication'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Business & Other'
      },
      {
        title: 'Digital Marketing Executive',
        company: 'MarketWave Media',
        location: 'Remote',
        salary: '$70,000 - $90,000',
        description: 'Drive customer acquisition through organic SEO audits, Google Analytics metric checks, and content creation. Optimize campaigns on social platforms and compose copy.',
        requiredSkills: ['SEO', 'Google Analytics', 'Digital Marketing', 'Social Media', 'Content Creation', 'Copywriting'],
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        department: 'Business & Other'
      }
    ];

    for (const job of seedData) {
      await db.create('jobs', job);
    }
    console.log('Seeded database with 25 default jobs.');
  }
}

// Route handlers

// AUTHENTICATION

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const existingUser = await db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.create('users', {
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving profile.' });
  }
});

// RESUMES

// POST /api/resumes/upload
app.post('/api/resumes/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Please upload a PDF resume.' });
  }

  const { githubUrl, linkedinUrl, leetcodeUrl, codechefUrl, hackerrankUrl } = req.body;

  if (!githubUrl) {
    return res.status(400).json({ message: 'GitHub URL is required.' });
  }

  const filePath = req.file.path;
  try {
    // 1. Read PDF file and parse text
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    const textContent = pdfData.text;

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('PDF file appears to be empty or unreadable.');
    }

    // 2. Perform AI / Local parsing & scoring analysis
    console.log(`Parsing resume "${req.file.originalname}" for user "${req.user.name}"...`);
    const analysis = await analyzeResume(textContent);

    // 3. Save parsed details into local database
    const savedResume = await db.create('resumes', {
      userId: req.user.id,
      fileName: req.file.originalname,
      resumeText: textContent,
      parsedData: analysis,
      githubUrl: githubUrl || '',
      linkedinUrl: linkedinUrl || '',
      leetcodeUrl: leetcodeUrl || '',
      codechefUrl: codechefUrl || '',
      hackerrankUrl: hackerrankUrl || ''
    });

    // 4. Clean up file on disk asynchronously
    await fs.unlink(filePath).catch(err => console.error('Failed to delete temp file:', err));

    res.status(201).json(savedResume);
  } catch (err) {
    console.error('Resume upload/parse error:', err);
    // Cleanup file if it still exists
    await fs.unlink(filePath).catch(() => {});
    res.status(500).json({ message: err.message || 'Error occurred during parsing the resume PDF.' });
  }
});

// GET /api/resumes (List resumes for the user)
app.get('/api/resumes', authenticateToken, async (req, res) => {
  try {
    const resumes = await db.find('resumes', { userId: req.user.id });
    // Strip raw text for list performance, return metadata + score
    const resumeList = resumes.map(r => ({
      id: r.id,
      fileName: r.fileName,
      score: r.parsedData.score,
      analysisType: r.parsedData.analysisType,
      createdAt: r.createdAt
    }));
    res.json(resumeList);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving resumes list.' });
  }
});

// GET /api/resumes/:id (Detail page data)
app.get('/api/resumes/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await db.findOne('resumes', { id: req.params.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    // Verify ownership
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to this resume.' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving resume details.' });
  }
});

// DELETE /api/resumes/:id
app.delete('/api/resumes/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await db.findOne('resumes', { id: req.params.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    // Verify ownership
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to delete this resume.' });
    }

    await db.delete('resumes', { id: req.params.id });
    res.json({ message: 'Resume successfully deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting resume.' });
  }
});

// JOBS

// GET /api/jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await db.find('jobs');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving jobs list.' });
  }
});

// POST /api/jobs (Add custom job to match against)
app.post('/api/jobs', authenticateToken, async (req, res) => {
  const { title, company, description, requiredSkills, salary, location, jobType, experienceLevel, department } = req.body;

  if (!title || !company || !description) {
    return res.status(400).json({ message: 'Job title, company, and description are required.' });
  }

  try {
    // Process skills if passed, or default empty list
    const parsedSkills = Array.isArray(requiredSkills) 
      ? requiredSkills 
      : requiredSkills 
        ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) 
        : [];

    const newJob = await db.create('jobs', {
      title,
      company,
      location: location || 'Remote',
      salary: salary || 'N/A',
      description,
      requiredSkills: parsedSkills,
      jobType: jobType || 'Full-time',
      experienceLevel: experienceLevel || 'Mid-level',
      department: department || 'Engineering'
    });

    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ message: 'Error creating job posting.' });
  }
});

// GET /api/jobs/:id/match/:resumeId
app.get('/api/jobs/:id/match/:resumeId', authenticateToken, async (req, res) => {
  try {
    const job = await db.findOne('jobs', { id: req.params.id });
    if (!job) {
      return res.status(404).json({ message: 'Job description not found.' });
    }

    const resume = await db.findOne('resumes', { id: req.params.resumeId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    // Verify ownership
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to this resume.' });
    }

    console.log(`Matching resume "${resume.fileName}" against job "${job.title}" at "${job.company}"...`);
    const comparison = await matchJob(resume.resumeText, job.description);

    res.json({
      jobId: job.id,
      resumeId: resume.id,
      jobTitle: job.title,
      company: job.company,
      ...comparison
    });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ message: 'Error calculating match statistics.' });
  }
});

// FAVORITE JOBS

// POST /api/jobs/:id/favorite (Toggle favorite)
app.post('/api/jobs/:id/favorite', authenticateToken, async (req, res) => {
  const jobId = req.params.id;
  try {
    const job = await db.findOne('jobs', { id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const existing = await db.findOne('favorites', { userId: req.user.id, jobId });
    if (existing) {
      await db.delete('favorites', { userId: req.user.id, jobId });
      return res.json({ favorited: false, message: 'Job removed from favorites.' });
    } else {
      await db.create('favorites', { userId: req.user.id, jobId });
      return res.json({ favorited: true, message: 'Job added to favorites.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating favorite status.' });
  }
});

// GET /api/jobs/favorites (List favorites)
app.get('/api/jobs/favorites', authenticateToken, async (req, res) => {
  try {
    const favs = await db.find('favorites', { userId: req.user.id });
    const favJobs = [];
    for (const fav of favs) {
      const job = await db.findOne('jobs', { id: fav.jobId });
      if (job) {
        favJobs.push({ ...job, isFavorited: true });
      }
    }
    res.json(favJobs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving saved jobs.' });
  }
});

// JOB APPLICATIONS

// POST /api/jobs/:id/apply (Apply with a resume)
app.post('/api/jobs/:id/apply', authenticateToken, async (req, res) => {
  const { resumeId } = req.body;
  const jobId = req.params.id;

  if (!resumeId) {
    return res.status(400).json({ message: 'Resume ID is required to apply.' });
  }

  try {
    const job = await db.findOne('jobs', { id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const resume = await db.findOne('resumes', { id: resumeId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to this resume.' });
    }

    // Check if already applied
    const existing = await db.findOne('applications', { userId: req.user.id, jobId });
    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this job.' });
    }

    // Determine status dynamically based on local match score
    const matchData = await matchJob(resume.resumeText, job.description);
    let status = 'Applied';
    if (matchData.matchScore >= 75) {
      status = 'Shortlisted';
    } else if (matchData.matchScore < 40) {
      status = 'Rejected';
    }

    const application = await db.create('applications', {
      userId: req.user.id,
      jobId,
      resumeId,
      status,
      matchScore: matchData.matchScore
    });

    res.status(201).json(application);
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ message: 'Error applying to job.' });
  }
});

// GET /api/applications (List applications)
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const apps = await db.find('applications', { userId: req.user.id });
    const enrichedApps = [];

    for (const app of apps) {
      const job = await db.findOne('jobs', { id: app.jobId });
      const resume = await db.findOne('resumes', { id: app.resumeId });

      if (job) {
        enrichedApps.push({
          id: app.id,
          jobId: app.jobId,
          resumeId: app.resumeId,
          status: app.status,
          matchScore: app.matchScore || 0,
          createdAt: app.createdAt,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          resumeName: resume ? resume.fileName : 'Deleted Resume'
        });
      }
    }

    res.json(enrichedApps);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications.' });
  }
});

// JOB ALERTS

// POST /api/alerts (Create alert)
app.post('/api/alerts', authenticateToken, async (req, res) => {
  const { keyword, department } = req.body;
  if (!keyword && !department) {
    return res.status(400).json({ message: 'Keyword or Department is required to configure alert.' });
  }
  try {
    const alert = await db.create('job_alerts', {
      userId: req.user.id,
      keyword: keyword || '',
      department: department || ''
    });
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Error setting up job alert.' });
  }
});

// GET /api/alerts (List alerts)
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await db.find('job_alerts', { userId: req.user.id });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job alerts.' });
  }
});

// DELETE /api/alerts/:id (Delete alert)
app.delete('/api/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await db.findOne('job_alerts', { id: req.params.id });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }
    if (alert.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to delete alert.' });
    }
    await db.delete('job_alerts', { id: req.params.id });
    res.json({ message: 'Job alert deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting job alert.' });
  }
});

// RECOMMENDATIONS

// GET /api/jobs/recommendations (Skills matching and ranking recommendations)
app.get('/api/jobs/recommendations', authenticateToken, async (req, res) => {
  const { resumeId } = req.query;
  if (!resumeId) {
    return res.status(400).json({ message: 'Resume ID is required for recommendations.' });
  }

  try {
    const resume = await db.findOne('resumes', { id: resumeId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access forbidden to this resume.' });
    }

    const jobs = await db.find('jobs');
    const resumeSkills = [
      ...(resume.parsedData.skills?.technical || []),
      ...(resume.parsedData.skills?.tools || []),
      ...(resume.parsedData.skills?.soft || [])
    ].map(s => s.toLowerCase());

    const recommendedJobs = [];
    for (const job of jobs) {
      const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      if (jobSkills.length === 0) {
        recommendedJobs.push({ ...job, matchScore: 50 });
        continue;
      }
      const matched = jobSkills.filter(s => resumeSkills.includes(s));
      const score = Math.round((matched.length / jobSkills.length) * 100);
      const finalScore = Math.max(10, Math.min(score, 100));
      recommendedJobs.push({ ...job, matchScore: finalScore });
    }

    // Sort by match score descending
    recommendedJobs.sort((a, b) => b.matchScore - a.matchScore);
    res.json(recommendedJobs);
  } catch (err) {
    console.error('Recommendations calculation failed:', err);
    res.status(500).json({ message: 'Error calculating recommendations.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// Start the server
async function startServer() {
  await seedJobs();
  app.listen(PORT, () => {
    console.log(`----------------------------------------`);
    console.log(`Backend Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`----------------------------------------`);
  });
}

startServer().catch(err => {
  console.error("Critical: Failed to launch backend server:", err);
});
// Hot reload trigger 2
