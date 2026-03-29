// src/lib/sample-data.ts

export const SAMPLE_SKILLS = [
  // Web Development
  { name: 'JavaScript', category: 'Programming' },
  { name: 'TypeScript', category: 'Programming' },
  { name: 'React', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Next.js', category: 'Frontend' },
  
  // Systems & Core Programming
  { name: 'C++', category: 'Programming' },
  { name: 'Data Structures', category: 'Computer Science' },
  { name: 'Algorithms', category: 'Computer Science' },
  { name: 'Discrete Mathematics', category: 'Mathematics' },
  { name: 'Linux Administration', category: 'OS' },
  { name: 'Parrot OS', category: 'OS' },
  
  // Security & Networking
  { name: 'Network Security', category: 'Cybersecurity' },
  { name: 'Ethical Hacking', category: 'Cybersecurity' },
  { name: 'Cryptography', category: 'Cybersecurity' },
  { name: 'SOHO Networking', category: 'Networking' },
  
  // AI & Data
  { name: 'Python', category: 'Programming' },
  { name: 'Machine Learning', category: 'AI/ML' },
  { name: 'Natural Language Processing', category: 'AI/ML' },
  { name: 'SQL', category: 'Database' },
  { name: 'Neo4j', category: 'Database' },
  
  // Languages & Global Skills
  { name: 'Japanese (N5)', category: 'Languages' },
  { name: 'Japanese (N4)', category: 'Languages' },
  { name: 'English (Fluent)', category: 'Languages' },
];

export const SAMPLE_JOBS = [
  { 
    title: 'Junior Cybersecurity Analyst', 
    company: 'SecureGuard Networks', 
    location: 'Remote',
    type: 'Full-time',
    salary: '$75k - $95k',
    required: ['Network Security', 'Linux Administration', 'Ethical Hacking'], 
    preferred: ['Parrot OS', 'Cryptography', 'Python'] 
  },
  { 
    title: 'Bilingual Software Engineer', 
    company: 'TokyoTech Innovations', 
    location: 'Tokyo, Japan (Relocation)',
    type: 'Full-time',
    salary: '¥8M - ¥12M',
    required: ['TypeScript', 'React', 'Node.js', 'Japanese (N5)'], 
    preferred: ['Japanese (N4)', 'Next.js', 'SQL'] 
  },
  { 
    title: 'AI Systems Architect', 
    company: 'Stark Automation', 
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$140k - $190k',
    required: ['Python', 'Machine Learning', 'Natural Language Processing', 'Data Structures'], 
    preferred: ['C++', 'Neo4j', 'Discrete Mathematics'] 
  },
  { 
    title: 'Core Backend Developer', 
    company: 'FinServe Global', 
    location: 'London, UK',
    type: 'Full-time',
    salary: '$100k - $130k',
    required: ['C++', 'Algorithms', 'Data Structures', 'SQL'], 
    preferred: ['Linux Administration', 'Network Security'] 
  },
  { 
    title: 'Full Stack Web Developer', 
    company: 'Creative Web Agency', 
    location: 'Remote',
    type: 'Contract',
    salary: '$60/hr',
    required: ['JavaScript', 'React', 'Node.js', 'SQL'], 
    preferred: ['TypeScript', 'Next.js'] 
  },
  { 
    title: 'IT Network Specialist', 
    company: 'TechInfra Solutions', 
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$70k - $90k',
    required: ['SOHO Networking', 'Linux Administration'], 
    preferred: ['Parrot OS', 'Network Security', 'Python'] 
  }
];