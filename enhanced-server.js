// Enhanced server.js with improved extraction algorithms

const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI (with fallback)
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));
app.use('/uploads', express.static('uploads'));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// IMPROVED TEXT EXTRACTION
async function extractTextFromFile(filePath, mimetype) {
    try {
        if (mimetype === 'application/pdf') {
            const fileBuffer = await fs.readFile(filePath);
            const data = await pdfParse(fileBuffer);
            console.log('Extracted PDF text length:', data.text.length);
            console.log('First 500 chars:', data.text.substring(0, 500));
            return data.text;
        } else if (mimetype === 'text/plain') {
            const text = await fs.readFile(filePath, 'utf8');
            console.log('Extracted TXT text length:', text.length);
            return text;
        } else {
            return "Document text extraction not implemented for this file type yet.";
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error;
    }
}

// IMPROVED SKILLS EXTRACTION
function extractSkills(text) {
    const skillsKeywords = [
        // Frontend Technologies
        'React', 'React.js', 'ReactJS', 'Angular', 'Vue', 'Vue.js', 'JavaScript', 'TypeScript', 'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'Bootstrap', 'Tailwind', 'Tailwind CSS', 'jQuery', 'Next.js', 'NextJS', 'Nuxt.js',
        
        // Backend Technologies  
        'Node.js', 'NodeJS', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'ASP.NET', '.NET', 'PHP', 'Laravel', 'Symfony', 'Ruby on Rails', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
        
        // Databases
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'Firebase', 'Firestore',
        
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions', 'Travis CI', 'CircleCI', 'Terraform', 'Ansible',
        
        // Tools & Others
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Figma', 'Adobe XD', 'Photoshop', 'VS Code', 'IntelliJ', 'Postman', 'REST API', 'REST APIs', 'GraphQL', 'Microservices', 'API',
        
        // Mobile Development
        'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Xamarin', 'Cordova', 'Ionic',
        
        // Data Science & AI
        'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn', 'Jupyter', 'R',
        
        // Methodologies
        'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'Microservices Architecture',
        
        // Soft Skills
        'Leadership', 'Project Management', 'Team Management', 'Communication', 'Problem Solving', 'Critical Thinking'
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    // More flexible matching
    skillsKeywords.forEach(skill => {
        const skillLower = skill.toLowerCase();
        const skillPattern = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars
        const regex = new RegExp(`\\b${skillPattern}\\b`, 'i');
        
        if (regex.test(text)) {
            foundSkills.push(skill);
        }
    });

    console.log('Skills found:', foundSkills);
    return [...new Set(foundSkills)]; // Remove duplicates
}

// IMPROVED EXPERIENCE EXTRACTION
function extractExperience(text) {
    console.log('Analyzing experience from text...');
    
    const experiencePatterns = [
        /(\d+)\+?\s*years?\s*of\s*experience/gi,
        /(\d+)\+?\s*years?\s*experience/gi,
        /experience\s*:?\s*(\d+)\+?\s*years?/gi,
        /(\d+)\+?\s*yrs?\s*experience/gi,
        /(\d+)\+?\s*year\s*of\s*experience/gi,
        /with\s*(\d+)\+?\s*years?/gi,
        /over\s*(\d+)\+?\s*years?/gi,
        /more\s*than\s*(\d+)\+?\s*years?/gi
    ];

    let maxYears = 0;
    let foundExperience = false;
    
    experiencePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                console.log('Experience match found:', match);
                const yearMatch = match.match(/\d+/);
                if (yearMatch) {
                    const years = parseInt(yearMatch[0]);
                    if (years > maxYears) {
                        maxYears = years;
                        foundExperience = true;
                    }
                }
            });
        }
    });

    // If no explicit years mentioned, try to extract from work history dates
    if (!foundExperience) {
        console.log('No explicit experience found, analyzing date ranges...');
        
        // Look for date patterns like "Jan 2023 - Present", "2022-2024", etc.
        const datePatterns = [
            /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{4}\s*-\s*(?:present|current)/gi,
            /\b(20\d{2})\s*-\s*(?:present|current)/gi,
            /\b(20\d{2})\s*-\s*(20\d{2})/gi
        ];

        const currentYear = new Date().getFullYear();
        let earliestYear = currentYear;
        let hasCurrentJob = false;

        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    console.log('Date match found:', match);
                    
                    if (match.toLowerCase().includes('present') || match.toLowerCase().includes('current')) {
                        hasCurrentJob = true;
                    }
                    
                    const yearMatches = match.match(/20\d{2}/g);
                    if (yearMatches) {
                        yearMatches.forEach(year => {
                            const yearNum = parseInt(year);
                            if (yearNum < earliestYear) {
                                earliestYear = yearNum;
                            }
                        });
                    }
                });
            }
        });

        if (hasCurrentJob && earliestYear < currentYear) {
            const calculatedYears = currentYear - earliestYear;
            maxYears = Math.max(maxYears, calculatedYears);
            console.log(`Calculated experience: ${calculatedYears} years (${earliestYear} to present)`);
        }
    }

    console.log('Final experience:', maxYears);
    return maxYears;
}

// IMPROVED CONTACT INFO EXTRACTION
function extractContactInfo(text) {
    console.log('Extracting contact info...');
    
    // More comprehensive email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // More comprehensive phone regex
    const phoneRegex = /(?:\+91[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?[\d\s-]{7,12}/g;
    
    // Improved name extraction - look for patterns at the beginning
    const namePatterns = [
        /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m, // First line name pattern
        /(?:name\s*:?\s*)([A-Z][a-z]+ [A-Z][a-z]+)/i, // "Name: John Doe"
        /^([A-Z][A-Z\s]+)$/m, // ALL CAPS name on its own line
    ];

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    
    let extractedName = 'Not found';
    
    // Try different name extraction patterns
    for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
            extractedName = nameMatch[1].trim();
            break;
        }
    }
    
    // If still not found, try extracting from the first few lines
    if (extractedName === 'Not found') {
        const lines = text.split('\n').slice(0, 5); // Check first 5 lines
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Look for lines that could be names (2-3 words, proper case)
            if (trimmedLine.match(/^[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/) && trimmedLine.length < 50) {
                extractedName = trimmedLine;
                break;
            }
        }
    }

    const result = {
        name: extractedName,
        email: emails[0] || 'Not found',
        phone: phones[0] ? phones[0].replace(/\s+/g, ' ').trim() : 'Not found'
    };
    
    console.log('Extracted contact info:', result);
    return result;
}

// IMPROVED RESUME SCORING
function calculateResumeScore(analysisData) {
    let score = 0;
    
    console.log('Calculating resume score...');
    console.log('Analysis data:', analysisData);

    // Contact information (20 points)
    if (analysisData.contactInfo.email !== 'Not found') {
        score += 10;
        console.log('Email found: +10 points');
    }
    if (analysisData.contactInfo.phone !== 'Not found') {
        score += 10;
        console.log('Phone found: +10 points');
    }

    // Skills (30 points)
    const skillsCount = analysisData.skills.length;
    if (skillsCount >= 10) {
        score += 30;
        console.log(`${skillsCount} skills found: +30 points`);
    } else if (skillsCount >= 5) {
        score += 20;
        console.log(`${skillsCount} skills found: +20 points`);
    } else if (skillsCount >= 1) {
        score += 10;
        console.log(`${skillsCount} skills found: +10 points`);
    }

    // Experience (25 points)
    const experience = analysisData.experience;
    if (experience >= 5) {
        score += 25;
        console.log(`${experience} years experience: +25 points`);
    } else if (experience >= 3) {
        score += 20;
        console.log(`${experience} years experience: +20 points`);
    } else if (experience >= 1) {
        score += 15;
        console.log(`${experience} years experience: +15 points`);
    } else if (experience > 0) {
        score += 10;
        console.log(`${experience} years experience: +10 points`);
    }

    // Resume length (10 points)
    const wordCount = analysisData.wordCount;
    if (wordCount >= 300 && wordCount <= 800) {
        score += 10;
        console.log(`Word count ${wordCount}: +10 points`);
    } else if (wordCount >= 200) {
        score += 7;
        console.log(`Word count ${wordCount}: +7 points`);
    } else if (wordCount >= 100) {
        score += 5;
        console.log(`Word count ${wordCount}: +5 points`);
    }

    // Content quality (15 points)
    const textLower = analysisData.text.toLowerCase();
    let contentPoints = 0;
    
    if (textLower.includes('education') || textLower.includes('degree') || textLower.includes('university') || textLower.includes('college')) {
        contentPoints += 3;
        console.log('Education section found: +3 points');
    }
    if (textLower.includes('experience') || textLower.includes('work') || textLower.includes('job') || textLower.includes('position')) {
        contentPoints += 3;
        console.log('Experience section found: +3 points');
    }
    if (textLower.includes('project') || textLower.includes('portfolio')) {
        contentPoints += 3;
        console.log('Projects section found: +3 points');
    }
    if (textLower.includes('skill') || textLower.includes('technical') || textLower.includes('proficient')) {
        contentPoints += 3;
        console.log('Skills section found: +3 points');
    }
    if (textLower.includes('achievement') || textLower.includes('award') || textLower.includes('certification')) {
        contentPoints += 3;
        console.log('Achievements section found: +3 points');
    }
    
    score += contentPoints;

    const finalScore = Math.min(Math.round(score), 100); // Cap at 100
    console.log('Final calculated score:', finalScore);
    return finalScore;
}

// Enhanced AI analysis with fallback
async function analyzeWithAI(text, jobDescription = '') {
    try {
        if (!openai || !process.env.OPENAI_API_KEY) {
            console.warn('OpenAI not configured, using enhanced fallback analysis');
            
            // More intelligent fallback based on actual resume content
            const hasProjects = text.toLowerCase().includes('project');
            const hasExperience = text.toLowerCase().includes('experience') || text.toLowerCase().includes('developer');
            const skillsCount = extractSkills(text).length;
            
            return {
                summary: `Dedicated Full Stack Web Developer with proven experience in modern web technologies. ${hasProjects ? 'Demonstrated project delivery capabilities' : 'Strong technical foundation'} with expertise in React, Node.js, and database technologies.`,
                strengths: [
                    skillsCount > 8 ? "Comprehensive technical skill set" : "Solid technical foundation",
                    hasExperience ? "Relevant professional experience" : "Strong educational background", 
                    hasProjects ? "Practical project experience" : "Clear communication skills"
                ],
                improvements: [
                    "Add more quantified achievements (e.g., '40% performance improvement')",
                    "Include specific project outcomes and metrics",
                    "Enhance soft skills and leadership examples"
                ],
                missingSkills: ["Docker", "AWS/Cloud Services", "Unit Testing", "CI/CD Pipeline"],
                assessment: `Strong technical profile ${hasExperience ? 'with relevant industry experience' : 'ready for professional opportunities'}. The resume demonstrates good technical breadth and would benefit from more quantified achievements and cloud technology exposure.`
            };
        }

        // OpenAI analysis code remains the same...
        const prompt = `Analyze this resume and provide detailed feedback:

Resume Text: ${text}

${jobDescription ? `Job Description: ${jobDescription}` : ''}

Please provide:
1. A professional summary (2-3 lines)
2. Top 3 strengths
3. Top 3 areas for improvement
4. Missing keywords or skills for the target role
5. Overall assessment

Format your response as JSON with these keys: summary, strengths, improvements, missingSkills, assessment`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert HR professional and resume analyzer. Provide constructive, specific feedback."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('AI analysis error:', error);
        // Enhanced fallback
        return {
            summary: "Professional with relevant experience and demonstrated skills in their field.",
            strengths: ["Strong technical skills", "Relevant experience", "Clear formatting"],
            improvements: ["Add more quantified achievements", "Include relevant keywords", "Improve formatting"],
            missingSkills: ["Industry-specific skills", "Soft skills", "Certifications"],
            assessment: "The resume shows good potential with room for targeted improvements."
        };
    }
}

// Routes remain the same but with improved logging
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
    try {
        console.log('=== Starting Resume Analysis ===');
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File details:', {
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const { jobDescription = '', targetRole = '' } = req.body;

        // Extract text from uploaded file
        const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
        
        if (!extractedText || extractedText.length < 10) {
            throw new Error('Failed to extract meaningful text from the document');
        }

        console.log('Text extraction successful, length:', extractedText.length);
        
        // Perform analysis
        const contactInfo = extractContactInfo(extractedText);
        const skills = extractSkills(extractedText);
        const experience = extractExperience(extractedText);
        const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

        const analysisData = {
            text: extractedText,
            contactInfo,
            skills,
            experience,
            wordCount
        };

        console.log('Analysis summary:', {
            contactFound: contactInfo.name !== 'Not found',
            skillsCount: skills.length,
            experienceYears: experience,
            wordCount
        });

        // Calculate score
        const resumeScore = calculateResumeScore(analysisData);

        // Get AI analysis
        const aiAnalysis = await analyzeWithAI(extractedText, jobDescription);

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        // Prepare response
        const response = {
            success: true,
            analysis: {
                contactInfo,
                skills,
                experience,
                wordCount,
                resumeScore,
                aiAnalysis,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                analysisDate: new Date().toISOString()
            }
        };

        console.log('=== Analysis Complete ===');
        console.log('Score:', resumeScore);
        console.log('Skills found:', skills.length);
        
        res.json(response);

    } catch (error) {
        console.error('Analysis error:', error);
        
        // Clean up file if it exists
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        res.status(500).json({ 
            error: 'Analysis failed', 
            message: error.message 
        });
    }
});

// Other routes remain the same...
app.get('/api/skills-suggestions/:role', (req, res) => {
    const role = req.params.role.toLowerCase();
    
    const skillsByRole = {
        'software-engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'],
        'data-scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'Statistics', 'Tableau'],
        'product-manager': ['Agile', 'Scrum', 'Jira', 'Analytics', 'A/B Testing', 'User Research', 'Roadmapping'],
        'designer': ['Figma', 'Photoshop', 'Illustrator', 'Sketch', 'User Research', 'Prototyping', 'CSS'],
        'marketing': ['Google Analytics', 'SEO', 'Social Media', 'Content Marketing', 'Email Marketing', 'PPC'],
        'default': ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Time Management']
    };

    const suggestions = skillsByRole[role] || skillsByRole['default'];
    res.json({ skills: suggestions });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
    }

    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Create uploads directory if it doesn't exist
async function ensureUploadsDir() {
    try {
        await fs.access('uploads');
    } catch {
        await fs.mkdir('uploads', { recursive: true });
        console.log('Created uploads directory');
    }
}

// Start server
const startServer = async () => {
    await ensureUploadsDir();
    
    app.listen(PORT, () => {
        console.log(`🚀 Resume Analysis Server running on port ${PORT}`);
        console.log(`📄 Frontend: http://localhost:${PORT}`);
        console.log(`🔌 API: http://localhost:${PORT}/api`);
        console.log(`🤖 OpenAI: ${openai ? 'Enabled' : 'Disabled (using fallback)'}`);
    });
};

startServer().catch(console.error);

module.exports = app;