import { ProfileData, JobData } from '../types';

// Mock job data
const mockJobs: JobData[] = [
  {
    id: 1,
    title: 'Senior React Developer',
    company_name: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    experience_level: 'Senior',
    salary_range: '$120,000 - $150,000',
    description: 'We are looking for a senior React developer with 5+ years of experience...',
    job_url: 'https://example.com/job/1',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'Redux', 'Node.js'],
    preferred_skills: ['GraphQL', 'AWS', 'Docker', 'Jest'],
    posted_date: '2024-01-15',
  },
  {
    id: 2,
    title: 'Full Stack Developer',
    company_name: 'StartupXYZ',
    location: 'Remote',
    experience_level: 'Mid',
    salary_range: '$80,000 - $110,000',
    description: 'Join our growing team as a full stack developer...',
    job_url: 'https://example.com/job/2',
    required_skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    preferred_skills: ['TypeScript', 'Docker', 'AWS'],
    posted_date: '2024-01-14',
  },
  {
    id: 3,
    title: 'Frontend Engineer',
    company_name: 'DesignStudio',
    location: 'New York, NY',
    experience_level: 'Mid',
    salary_range: '$90,000 - $120,000',
    description: 'Create beautiful user interfaces with modern web technologies...',
    job_url: 'https://example.com/job/3',
    required_skills: ['React', 'CSS', 'JavaScript', 'Figma'],
    preferred_skills: ['TypeScript', 'Storybook', 'Jest'],
    posted_date: '2024-01-13',
  },
  {
    id: 4,
    title: 'Backend Developer',
    company_name: 'DataFlow Systems',
    location: 'Austin, TX',
    experience_level: 'Senior',
    salary_range: '$100,000 - $140,000',
    description: 'Build scalable backend systems and APIs...',
    job_url: 'https://example.com/job/4',
    required_skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis'],
    preferred_skills: ['AWS', 'Docker', 'Kubernetes', 'GraphQL'],
    posted_date: '2024-01-12',
  },
  {
    id: 5,
    title: 'DevOps Engineer',
    company_name: 'CloudTech',
    location: 'Seattle, WA',
    experience_level: 'Senior',
    salary_range: '$110,000 - $160,000',
    description: 'Manage infrastructure and deployment pipelines...',
    job_url: 'https://example.com/job/5',
    required_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    preferred_skills: ['Python', 'Bash', 'Jenkins', 'Prometheus'],
    posted_date: '2024-01-11',
  },
];

export const mockApiService = {
  async analyzeProfile(_file: File): Promise<ProfileData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock profile data based on file name or generate random data
    const mockProfile: ProfileData = {
      id: `profile_${Date.now()}`,
      education: [
        'Bachelor of Science in Computer Science - University of California',
        'Master of Science in Software Engineering - Stanford University'
      ],
      certifications: [
        'AWS Certified Solutions Architect',
        'Google Cloud Professional Developer',
        'Certified Kubernetes Administrator'
      ],
      experience: {
        roles: ['Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer'],
        totalYears: 6,
        companies: ['Google', 'Microsoft', 'StartupCo']
      },
      skills: {
        technical: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'],
        soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management']
      },
      summary: 'Experienced full-stack developer with 6+ years of experience building scalable web applications. Strong background in React, Node.js, and cloud technologies.',
      uploadedAt: new Date().toISOString(),
    };

    return mockProfile;
  },

  async getJobs(options: { limit?: number; page?: number } = {}): Promise<JobData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { limit = 50, page = 1 } = options;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return mockJobs.slice(startIndex, endIndex);
  },

  async getJobById(id: number): Promise<JobData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockJobs.find(job => job.id === id) || null;
  },

  async downloadAnalysisReport(profileId: string): Promise<Blob> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a mock PDF blob
    const mockPdfContent = `Analysis Report for Profile: ${profileId}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\nThis is a mock analysis report.`;
    return new Blob([mockPdfContent], { type: 'application/pdf' });
  },
};