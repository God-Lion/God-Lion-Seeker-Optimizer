import { ProfileData, JobData, MatchingResult } from '../types';

export const jobMatchingEngine = {
  matchProfileToJobs(profile: ProfileData, jobs: JobData[]): MatchingResult[] {
    return jobs.map(job => {
      const matchedSkills = this.findMatchedSkills(profile, job);
      const missingSkills = this.findMissingSkills(profile, job);
      const fitScore = this.calculateFitScore(profile, job, matchedSkills, missingSkills);
      const matchReason = this.generateMatchReasons(profile, job, matchedSkills, missingSkills);

      return {
        jobId: job.id,
        job,
        fitScore,
        matchedSkills,
        missingSkills,
        matchReason,
      };
    }).sort((a, b) => b.fitScore - a.fitScore);
  },

  findMatchedSkills(profile: ProfileData, job: JobData): string[] {
    const allProfileSkills = [
      ...profile.skills.technical,
      ...profile.skills.soft,
    ].map(skill => skill.toLowerCase());

    const allJobSkills = [
      ...job.required_skills,
      ...job.preferred_skills,
    ].map(skill => skill.toLowerCase());

    return allJobSkills.filter(jobSkill => 
      allProfileSkills.some(profileSkill => 
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      )
    );
  },

  findMissingSkills(profile: ProfileData, job: JobData): string[] {
    const allProfileSkills = [
      ...profile.skills.technical,
      ...profile.skills.soft,
    ].map(skill => skill.toLowerCase());

    const requiredJobSkills = job.required_skills.map(skill => skill.toLowerCase());

    return requiredJobSkills.filter(jobSkill => 
      !allProfileSkills.some(profileSkill => 
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      )
    );
  },

  calculateFitScore(
    profile: ProfileData, 
    job: JobData, 
    matchedSkills: string[], 
    _missingSkills: string[]
  ): number {
    const totalRequiredSkills = job.required_skills.length;
    const totalPreferredSkills = job.preferred_skills.length;
    const totalSkills = totalRequiredSkills + totalPreferredSkills;

    if (totalSkills === 0) return 0;

    // Base score from matched skills
    const matchedRequiredSkills = matchedSkills.filter(skill => 
      job.required_skills.some(req => req.toLowerCase() === skill)
    ).length;
    
    const matchedPreferredSkills = matchedSkills.filter(skill => 
      job.preferred_skills.some(pref => pref.toLowerCase() === skill)
    ).length;

    // Calculate skill match percentage
    const requiredSkillScore = (matchedRequiredSkills / totalRequiredSkills) * 60;
    const preferredSkillScore = (matchedPreferredSkills / totalPreferredSkills) * 30;

    // Experience level matching bonus
    let experienceBonus = 0;
    const profileYears = profile.experience.totalYears;
    const jobLevel = job.experience_level.toLowerCase();

    if (jobLevel === 'entry' && profileYears <= 2) experienceBonus = 10;
    else if (jobLevel === 'mid' && profileYears >= 2 && profileYears <= 5) experienceBonus = 10;
    else if (jobLevel === 'senior' && profileYears >= 5) experienceBonus = 10;
    else if (jobLevel === 'senior' && profileYears >= 3) experienceBonus = 5;

    // Company experience bonus
    const companyMatch = profile.experience.companies.some(company => 
      job.company_name.toLowerCase().includes(company.toLowerCase()) ||
      company.toLowerCase().includes(job.company_name.toLowerCase())
    );
    const companyBonus = companyMatch ? 5 : 0;

    const totalScore = Math.min(100, requiredSkillScore + preferredSkillScore + experienceBonus + companyBonus);
    
    return Math.round(totalScore);
  },

  generateMatchReasons(
    profile: ProfileData, 
    job: JobData, 
    matchedSkills: string[], 
    _missingSkills: string[]
  ): string[] {
    const reasons: string[] = [];

    // Skill match reasons
    if (matchedSkills.length > 0) {
      reasons.push(`Strong match with ${matchedSkills.length} required/preferred skills`);
    }

    // Experience level match
    const profileYears = profile.experience.totalYears;
    const jobLevel = job.experience_level.toLowerCase();
    
    if (jobLevel === 'entry' && profileYears <= 2) {
      reasons.push('Experience level aligns with entry-level position');
    } else if (jobLevel === 'mid' && profileYears >= 2 && profileYears <= 5) {
      reasons.push('Experience level matches mid-level requirements');
    } else if (jobLevel === 'senior' && profileYears >= 5) {
      reasons.push('Senior-level experience matches job requirements');
    }

    // Company experience
    const hasCompanyExperience = profile.experience.companies.some(company => 
      job.company_name.toLowerCase().includes(company.toLowerCase()) ||
      company.toLowerCase().includes(job.company_name.toLowerCase())
    );
    
    if (hasCompanyExperience) {
      reasons.push('Previous experience with similar companies');
    }

    // Education match (if relevant)
    if (profile.education.some(edu => 
      edu.toLowerCase().includes('computer') || 
      edu.toLowerCase().includes('engineering') ||
      edu.toLowerCase().includes('technology')
    )) {
      reasons.push('Relevant educational background');
    }

    return reasons;
  },

  getSkillGaps(profile: ProfileData, job: JobData) {
    const missingSkills = this.findMissingSkills(profile, job);
    
    return missingSkills.map(skill => ({
      skill,
      importance: job.required_skills.includes(skill) ? 'critical' as const : 'important' as const,
      estimatedLearningHours: this.estimateLearningHours(skill),
      resources: this.getLearningResources(skill),
    }));
  },

  estimateLearningHours(skill: string): number {
    // Simple estimation based on skill complexity
    const skillLower = skill.toLowerCase();
    
    if (skillLower.includes('react') || skillLower.includes('angular') || skillLower.includes('vue')) {
      return 40;
    } else if (skillLower.includes('aws') || skillLower.includes('azure') || skillLower.includes('gcp')) {
      return 60;
    } else if (skillLower.includes('docker') || skillLower.includes('kubernetes')) {
      return 30;
    } else if (skillLower.includes('python') || skillLower.includes('java') || skillLower.includes('c#')) {
      return 80;
    } else {
      return 20;
    }
  },

  getLearningResources(skill: string): string[] {
    const skillLower = skill.toLowerCase();
    
    if (skillLower.includes('react')) {
      return ['React Official Docs', 'React Tutorial', 'Codecademy React Course'];
    } else if (skillLower.includes('aws')) {
      return ['AWS Training', 'AWS Documentation', 'A Cloud Guru'];
    } else if (skillLower.includes('docker')) {
      return ['Docker Official Tutorial', 'Docker Deep Dive', 'Pluralsight Docker Course'];
    } else {
      return ['Official Documentation', 'Online Tutorials', 'Community Forums'];
    }
  },
};
