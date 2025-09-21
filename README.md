Website Link: the server is not running. bcz the website in not deployed properly but i have a demo video of my working webisite



AI Resume Analyzer
A full-stack web application that uses AI to analyze resumes (PDF, DOC, DOCX, TXT) and provide personalized feedback, including skill extraction, experience calculation, resume scoring, and AI-powered insights.

Features
Upload resume files and extract key information

Detect contact info: name, email, phone

Extract technical and soft skills with keyword matching

Calculate years of professional experience

Generate a resume score (out of 100)

Use OpenAI API to create professional summary, strengths, improvements, and gap analysis

Responsive and modern web interface

Support for multiple file formats



Technology Stack
Frontend: HTML5, CSS3, JavaScript

Backend: Node.js, Express.js, Multer, pdf-parse, OpenAI API

AI: OpenAI GPT-3.5 Turbo for resume analysis



resume-analyzer-app/
├── frontend/
│   └── index.html         # Web app frontend
├── uploads/               # Uploaded resumes storage
├── server.js              # Express backend server
├── package.json           # Project dependencies
├── .env                   # Environment variables (API keys, etc.)
└── README.md              # This file
