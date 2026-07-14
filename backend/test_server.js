const db = require('./utils/db');
const { analyzeResume, matchJob, extractSkillsLocally } = require('./utils/ai');

async function runTests() {
  console.log('=== Running Core Backend Tests ===');
  
  try {
    // 1. Test database CRUD
    console.log('\n[1/3] Testing File DB CRUD Operations...');
    const testUser = await db.create('users', {
      name: 'Test Engineer',
      email: 'test@example.com',
      passwordHash: 'dummyhash'
    });
    console.log('✓ Created User ID:', testUser.id);
    
    const foundUser = await db.findOne('users', { id: testUser.id });
    if (foundUser && foundUser.name === 'Test Engineer') {
      console.log('✓ Found User successfully.');
    } else {
      throw new Error('User not found after creation.');
    }

    const updated = await db.update('users', { id: testUser.id }, { name: 'Test Engineer Updated' });
    console.log(`✓ Updated ${updated} document(s).`);
    
    const foundUpdatedUser = await db.findOne('users', { id: testUser.id });
    if (foundUpdatedUser.name === 'Test Engineer Updated') {
      console.log('✓ Update verified successfully.');
    } else {
      throw new Error('User name update failed.');
    }

    const deleted = await db.delete('users', { id: testUser.id });
    console.log(`✓ Deleted ${deleted} document(s).`);
    
    const searchDeleted = await db.findOne('users', { id: testUser.id });
    if (!searchDeleted) {
      console.log('✓ Delete verified successfully.');
    } else {
      throw new Error('User delete failed.');
    }

    // 2. Test Local Skills & Analysis Fallback
    console.log('\n[2/3] Testing Local NLP Analysis Logic...');
    const dummyResumeText = `
John Doe
Software Engineer
Email: john.doe@example.com | Phone: 123-456-7890 | GitHub: github.com/johndoe

EDUCATION
Bachelor of Science in Computer Science
State University, 2020 - 2024

EXPERIENCE
Frontend Developer Intern at WebTech Corp (Jan 2024 - Present)
- Developed responsive web interfaces using React, JavaScript, and Tailwind CSS.
- Collaborated in an Agile scrum environment with developers and product managers.
- Utilized Git for version control and integrated REST APIs.

PROJECTS
E-Commerce Portal
- Built a custom shopping cart backend using Node.js and Express.
- Stored data in MongoDB database.
- Deployed frontend built with Vite.

SKILLS
Programming: JavaScript, Python, TypeScript, HTML, CSS
Frameworks & Tools: React, Node.js, Express, Tailwind, Git, Docker, MongoDB
Soft Skills: Teamwork, Problem Solving, Communication, Collaboration
`;

    const localAnalysis = await analyzeResume(dummyResumeText);
    console.log('✓ Analysis Type used:', localAnalysis.analysisType);
    console.log('✓ Extracted Skills (Technical):', localAnalysis.skills.technical.join(', '));
    console.log('✓ Extracted Skills (Tools):', localAnalysis.skills.tools.join(', '));
    console.log('✓ Extracted Skills (Soft):', localAnalysis.skills.soft.join(', '));
    console.log('✓ Resume Score:', localAnalysis.score, '/ 100');
    console.log('✓ Strengths count:', localAnalysis.strengths.length);
    console.log('✓ Weaknesses count:', localAnalysis.weaknesses.length);
    console.log('✓ Recommendations count:', localAnalysis.recommendations.length);

    if (localAnalysis.score > 60 && localAnalysis.skills.tools.includes('React')) {
      console.log('✓ Score & Skill extraction logic behaves correctly.');
    } else {
      throw new Error('Parser logic failed to score or identify skills.');
    }

    // 3. Test Local Keyword Job Matcher
    console.log('\n[3/3] Testing Job Matcher Logic...');
    const dummyJobDesc = `
Role: React Frontend Developer
We are looking for a frontend developer. Core requirements are React, Tailwind CSS, TypeScript, and Git.
We need someone with excellent communication skills, problem solving, and ability to work in an Agile team.
Experience with AWS or Docker is a plus.
`;

    const matchResults = await matchJob(dummyResumeText, dummyJobDesc);
    console.log('✓ Match Score:', matchResults.matchScore, '%');
    console.log('✓ Matched Skills:', matchResults.matchedSkills.join(', '));
    console.log('✓ Missing Skills:', matchResults.missingSkills.join(', '));
    console.log('✓ Feedback:', matchResults.feedback);
    console.log('✓ Interview Tips Count:', matchResults.interviewTips.length);

    if (matchResults.matchScore > 50 && matchResults.matchedSkills.includes('React')) {
      console.log('✓ Job Matching logic behaves correctly.');
    } else {
      throw new Error('Matching logic failed to compute score or identify overlaps.');
    }

    console.log('\n=== All Core Tests Passed Successfully ===');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
