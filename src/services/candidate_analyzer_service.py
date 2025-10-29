"""
Candidate Profile Analyzer - Main matching engine
Analyzes resumes and matches them with role profiles using semantic similarity.
"""
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import numpy as np
from pathlib import Path
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class RoleMatch:
    """Result of matching a resume to a role"""
    role_id: str
    role_title: str
    fit_score: float
    education_score: float
    certification_score: float
    experience_score: float
    skills_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    matched_certifications: List[str]
    missing_certifications: List[str]
    skill_gaps: List[str]
    recommendations: List[str]
    career_path: Dict[str, List[str]]


@dataclass
class AnalysisReport:
    """Complete analysis report for a candidate"""
    candidate_name: Optional[str]
    top_matches: List[RoleMatch]
    current_skills: List[str]
    years_experience: int
    education: List[str]
    certifications: List[str]
    recommendations: Dict[str, any]
    skill_development_plan: List[Dict[str, any]]


class CandidateProfileAnalyzer:
    """
    Main analyzer that matches candidate profiles to job roles.
    Uses weighted scoring based on education, certifications, experience, and skills.
    """
    
    # Default weights for scoring components
    DEFAULT_WEIGHTS = {
        'education': 0.2,
        'certifications': 0.2,
        'experience': 0.3,
        'skills': 0.3
    }
    
    def __init__(
        self,
        resume_parser,
        role_database,
        embeddings_model=None,
        weights: Optional[Dict[str, float]] = None
    ):
        """
        Initialize the analyzer.
        
        Args:
            resume_parser: ResumeParser instance
            role_database: RoleProfileDatabase instance
            embeddings_model: Optional embeddings model for semantic matching
            weights: Custom weights for scoring (default: DEFAULT_WEIGHTS)
        """
        self.resume_parser = resume_parser
        self.role_database = role_database
        self.embeddings_model = embeddings_model
        self.weights = weights or self.DEFAULT_WEIGHTS
        
        # Validate weights sum to 1.0
        total = sum(self.weights.values())
        if not (0.99 <= total <= 1.01):
            logger.warning("weights_dont_sum_to_one", total=total, weights=self.weights)
        
        logger.info(
            "analyzer_initialized",
            has_embeddings=embeddings_model is not None,
            weights=self.weights
        )
    
    def analyze_resume(
        self,
        resume_path: str,
        top_n: int = 5,
        min_score: float = 0.5
    ) -> AnalysisReport:
        """
        Analyze a resume and match to roles.
        
        Args:
            resume_path: Path to resume file
            top_n: Number of top matches to return
            min_score: Minimum fit score to include in results
            
        Returns:
            AnalysisReport with matches and recommendations
        """
        logger.info("analyzing_resume", path=resume_path, top_n=top_n)
        
        # Parse resume
        resume_data = self.resume_parser.parse_from_file(resume_path)
        
        # Match against all roles
        all_matches = []
        for profile in self.role_database.get_all_profiles():
            match = self._match_profile_to_role(resume_data, profile)
            if match.fit_score >= min_score:
                all_matches.append(match)
        
        # Sort by fit score
        all_matches.sort(key=lambda x: x.fit_score, reverse=True)
        top_matches = all_matches[:top_n]
        
        # Generate recommendations
        recommendations = self._generate_recommendations(resume_data, top_matches)
        
        # Create skill development plan
        skill_plan = self._create_skill_development_plan(resume_data, top_matches)
        
        # Extract candidate name from entities
        candidate_name = None
        if resume_data.entities.get('PERSON'):
            candidate_name = resume_data.entities['PERSON'][0]
        
        logger.info(
            "analysis_complete",
            matches_found=len(all_matches),
            top_score=top_matches[0].fit_score if top_matches else 0
        )
        
        return AnalysisReport(
            candidate_name=candidate_name,
            top_matches=top_matches,
            current_skills=resume_data.skills,
            years_experience=resume_data.years_experience,
            education=resume_data.education,
            certifications=resume_data.certifications or [],
            recommendations=recommendations,
            skill_development_plan=skill_plan
        )
    
    def _match_profile_to_role(self, resume_data, role_profile) -> RoleMatch:
        """
        Match a resume to a specific role profile.
        
        Args:
            resume_data: Parsed resume data
            role_profile: Role profile to match against
            
        Returns:
            RoleMatch with scores and details
        """
        # Calculate individual scores
        education_score = self._score_education(resume_data.education, role_profile)
        cert_score, matched_certs, missing_certs = self._score_certifications(
            resume_data.certifications or [],
            role_profile
        )
        exp_score = self._score_experience(resume_data.years_experience, role_profile)
        skills_score, matched_skills, missing_skills = self._score_skills(
            resume_data.skills,
            role_profile
        )
        
        # Calculate final weighted score
        fit_score = (
            self.weights['education'] * education_score +
            self.weights['certifications'] * cert_score +
            self.weights['experience'] * exp_score +
            self.weights['skills'] * skills_score
        )
        
        # Generate recommendations for this role
        recommendations = self._generate_role_recommendations(
            role_profile,
            missing_skills,
            missing_certs,
            exp_score
        )
        
        # Get career path information
        career_path = self.role_database.get_career_paths(role_profile.role_id)
        
        # Identify skill gaps (top priority skills to develop)
        skill_gaps = self._identify_skill_gaps(
            missing_skills,
            role_profile.required_skills
        )
        
        return RoleMatch(
            role_id=role_profile.role_id,
            role_title=role_profile.title,
            fit_score=round(fit_score, 3),
            education_score=round(education_score, 3),
            certification_score=round(cert_score, 3),
            experience_score=round(exp_score, 3),
            skills_score=round(skills_score, 3),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            matched_certifications=matched_certs,
            missing_certifications=missing_certs,
            skill_gaps=skill_gaps,
            recommendations=recommendations,
            career_path=career_path
        )
    
    def _score_education(self, education: List[str], role_profile) -> float:
        """Score education match (0.0 to 1.0)"""
        if not role_profile.required_education:
            return 1.0  # No requirement = full score
        
        if not education:
            return 0.0  # No education provided
        
        education_text = ' '.join(education).lower()
        
        # Check for degree levels
        has_bachelor = any(term in education_text for term in ['bachelor', 'b.s.', 'b.a.', 'bs ', 'ba '])
        has_master = any(term in education_text for term in ['master', 'm.s.', 'm.a.', 'ms ', 'ma ', 'mba'])
        has_phd = any(term in education_text for term in ['phd', 'ph.d.', 'doctorate'])
        
        required_text = ' '.join(role_profile.required_education).lower()
        
        # Score based on degree level
        if 'phd' in required_text or 'doctorate' in required_text:
            return 1.0 if has_phd else (0.7 if has_master else (0.4 if has_bachelor else 0.2))
        elif 'master' in required_text:
            return 1.0 if (has_master or has_phd) else (0.6 if has_bachelor else 0.2)
        elif 'bachelor' in required_text:
            return 1.0 if (has_bachelor or has_master or has_phd) else 0.3
        
        return 0.5  # Partial match
    
    def _score_certifications(
        self,
        certifications: List[str],
        role_profile
    ) -> Tuple[float, List[str], List[str]]:
        """
        Score certifications match.
        
        Returns:
            Tuple of (score, matched_certs, missing_certs)
        """
        all_required = role_profile.required_certifications + role_profile.preferred_certifications
        
        if not all_required:
            return 1.0, [], []  # No requirements = full score
        
        if not certifications:
            return 0.0, [], all_required
        
        certs_text = ' '.join(certifications).lower()
        matched = []
        missing = []
        
        for cert in all_required:
            cert_lower = cert.lower()
            # Flexible matching
            if cert_lower in certs_text or any(c in cert_lower for c in certs_text.split()):
                matched.append(cert)
            else:
                missing.append(cert)
        
        # Weight required certs more heavily
        required_matched = sum(1 for c in matched if c in role_profile.required_certifications)
        required_total = len(role_profile.required_certifications)
        preferred_matched = sum(1 for c in matched if c in role_profile.preferred_certifications)
        preferred_total = len(role_profile.preferred_certifications)
        
        if required_total == 0 and preferred_total == 0:
            score = 1.0
        elif required_total == 0:
            score = preferred_matched / preferred_total if preferred_total > 0 else 1.0
        else:
            required_score = required_matched / required_total
            preferred_score = preferred_matched / preferred_total if preferred_total > 0 else 0
            score = (0.7 * required_score) + (0.3 * preferred_score)
        
        return score, matched, missing
    
    def _score_experience(self, years_exp: int, role_profile) -> float:
        """Score years of experience (0.0 to 1.0)"""
        min_years = role_profile.min_years_experience
        avg_years = role_profile.avg_years_experience
        
        if years_exp >= avg_years:
            return 1.0
        elif years_exp >= min_years:
            # Linear scale between min and avg
            return 0.6 + (0.4 * (years_exp - min_years) / max(1, avg_years - min_years))
        elif years_exp > 0:
            # Partial credit below minimum
            return 0.3 + (0.3 * years_exp / max(1, min_years))
        else:
            return 0.0
    
    def _score_skills(
        self,
        candidate_skills: List[str],
        role_profile
    ) -> Tuple[float, List[str], List[str]]:
        """
        Score skills match with semantic similarity.
        
        Returns:
            Tuple of (score, matched_skills, missing_skills)
        """
        required = [s.lower() for s in role_profile.required_skills]
        preferred = [s.lower() for s in role_profile.preferred_skills]
        all_skills = required + preferred
        
        if not all_skills:
            return 1.0, [], []
        
        candidate_lower = [s.lower() for s in candidate_skills]
        
        if self.embeddings_model:
            # Use semantic similarity
            score, matched, missing = self._semantic_skill_matching(
                candidate_lower,
                required,
                preferred
            )
        else:
            # Use keyword matching
            matched = []
            missing = []
            
            for skill in all_skills:
                if any(skill in c or c in skill for c in candidate_lower):
                    matched.append(skill)
                else:
                    missing.append(skill)
            
            required_matched = sum(1 for s in matched if s in required)
            required_total = len(required)
            preferred_matched = sum(1 for s in matched if s in preferred)
            preferred_total = len(preferred)
            
            if required_total == 0:
                score = preferred_matched / preferred_total if preferred_total > 0 else 1.0
            else:
                required_score = required_matched / required_total
                preferred_score = preferred_matched / preferred_total if preferred_total > 0 else 0
                score = (0.75 * required_score) + (0.25 * preferred_score)
        
        return score, matched, missing
    
    def _semantic_skill_matching(
        self,
        candidate_skills: List[str],
        required: List[str],
        preferred: List[str]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Use embeddings for semantic skill matching.
        
        Returns:
            Tuple of (score, matched_skills, missing_skills)
        """
        # This is a placeholder for semantic matching
        # In production, you would use sentence-transformers or OpenAI embeddings
        
        # For now, fall back to keyword matching with fuzzy logic
        matched = []
        missing = []
        
        all_skills = required + preferred
        
        for skill in all_skills:
            # Simple fuzzy matching
            if any(
                skill in c or c in skill or
                self._fuzzy_match(skill, c) > 0.8
                for c in candidate_skills
            ):
                matched.append(skill)
            else:
                missing.append(skill)
        
        required_matched = sum(1 for s in matched if s in required)
        required_total = len(required)
        preferred_matched = sum(1 for s in matched if s in preferred)
        preferred_total = len(preferred)
        
        if required_total == 0:
            score = preferred_matched / preferred_total if preferred_total > 0 else 1.0
        else:
            required_score = required_matched / required_total
            preferred_score = preferred_matched / preferred_total if preferred_total > 0 else 0
            score = (0.75 * required_score) + (0.25 * preferred_score)
        
        return score, matched, missing
    
    def _fuzzy_match(self, str1: str, str2: str) -> float:
        """Simple fuzzy string matching (Levenshtein-like)"""
        str1, str2 = str1.lower(), str2.lower()
        if str1 == str2:
            return 1.0
        
        # Calculate similarity based on common characters
        common = set(str1) & set(str2)
        total = set(str1) | set(str2)
        
        return len(common) / len(total) if total else 0.0
    
    def _identify_skill_gaps(
        self,
        missing_skills: List[str],
        required_skills: List[str]
    ) -> List[str]:
        """Identify priority skill gaps (required skills that are missing)"""
        required_lower = [s.lower() for s in required_skills]
        gaps = []
        
        for skill in missing_skills:
            if skill.lower() in required_lower:
                gaps.append(skill)
        
        return gaps[:5]  # Top 5 priority gaps
    
    def _generate_role_recommendations(
        self,
        role_profile,
        missing_skills: List[str],
        missing_certs: List[str],
        experience_score: float
    ) -> List[str]:
        """Generate specific recommendations for a role"""
        recommendations = []
        
        # Skill recommendations
        if missing_skills:
            priority_skills = [s for s in missing_skills if s in role_profile.required_skills]
            if priority_skills:
                recommendations.append(
                    f"Develop these critical skills: {', '.join(priority_skills[:3])}"
                )
        
        # Certification recommendations
        if missing_certs:
            required_missing = [c for c in missing_certs if c in role_profile.required_certifications]
            if required_missing:
                recommendations.append(
                    f"Consider obtaining: {', '.join(required_missing[:2])}"
                )
        
        # Experience recommendations
        if experience_score < 0.7:
            recommendations.append(
                f"Gain more experience in {role_profile.category} (target: {role_profile.avg_years_experience}+ years)"
            )
        
        # Growth area suggestions
        if role_profile.growth_areas:
            recommendations.append(
                f"Emerging areas to explore: {', '.join(role_profile.growth_areas[:2])}"
            )
        
        return recommendations
    
    def _generate_recommendations(
        self,
        resume_data,
        top_matches: List[RoleMatch]
    ) -> Dict[str, any]:
        """Generate overall recommendations"""
        if not top_matches:
            return {
                'summary': 'No strong matches found. Consider expanding your skillset.',
                'actions': []
            }
        
        best_match = top_matches[0]
        
        recommendations = {
            'summary': f"Best fit: {best_match.role_title} ({best_match.fit_score*100:.0f}% match)",
            'immediate_actions': [],
            'short_term_goals': [],
            'long_term_goals': [],
            'trending_skills': []
        }
        
        # Immediate actions
        if best_match.skill_gaps:
            recommendations['immediate_actions'].append(
                f"Focus on developing: {', '.join(best_match.skill_gaps[:3])}"
            )
        
        # Short-term goals
        if best_match.missing_certifications:
            recommendations['short_term_goals'].append(
                f"Pursue certifications: {', '.join(best_match.missing_certifications[:2])}"
            )
        
        # Long-term goals
        if best_match.career_path.get('to'):
            recommendations['long_term_goals'].append(
                f"Career progression: {best_match.role_title} → {', '.join(best_match.career_path['to'][:2])}"
            )
        
        # Trending skills across top matches
        all_missing = []
        for match in top_matches[:3]:
            all_missing.extend(match.missing_skills)
        
        from collections import Counter
        common_missing = Counter(all_missing).most_common(5)
        recommendations['trending_skills'] = [skill for skill, _ in common_missing]
        
        return recommendations
    
    def _create_skill_development_plan(
        self,
        resume_data,
        top_matches: List[RoleMatch]
    ) -> List[Dict[str, any]]:
        """Create a prioritized skill development plan"""
        if not top_matches:
            return []
        
        plan = []
        best_match = top_matches[0]
        
        # Priority 1: Critical skill gaps for best match
        if best_match.skill_gaps:
            plan.append({
                'priority': 'High',
                'category': 'Required Skills',
                'skills': best_match.skill_gaps[:3],
                'reason': f"Essential for {best_match.role_title}",
                'timeline': '1-3 months'
            })
        
        # Priority 2: Certifications
        if best_match.missing_certifications:
            plan.append({
                'priority': 'High',
                'category': 'Certifications',
                'skills': best_match.missing_certifications[:2],
                'reason': 'Industry-recognized credentials',
                'timeline': '3-6 months'
            })
        
        # Priority 3: Preferred skills
        preferred_missing = [
            s for s in best_match.missing_skills
            if s not in best_match.skill_gaps
        ]
        if preferred_missing:
            plan.append({
                'priority': 'Medium',
                'category': 'Preferred Skills',
                'skills': preferred_missing[:3],
                'reason': 'Enhance competitiveness',
                'timeline': '3-6 months'
            })
        
        # Priority 4: Future-focused skills
        if len(top_matches) > 1:
            second_match = top_matches[1]
            future_skills = [
                s for s in second_match.skill_gaps
                if s not in best_match.matched_skills
            ]
            if future_skills:
                plan.append({
                    'priority': 'Medium',
                    'category': 'Future Opportunities',
                    'skills': future_skills[:3],
                    'reason': f"Opens path to {second_match.role_title}",
                    'timeline': '6-12 months'
                })
        
        return plan
    
    def compare_roles(
        self,
        resume_path: str,
        role_ids: List[str]
    ) -> List[RoleMatch]:
        """
        Compare specific roles against a resume.
        
        Args:
            resume_path: Path to resume file
            role_ids: List of role IDs to compare
            
        Returns:
            List of RoleMatch objects
        """
        resume_data = self.resume_parser.parse_from_file(resume_path)
        
        matches = []
        for role_id in role_ids:
            profile = self.role_database.get_profile(role_id)
            if profile:
                match = self._match_profile_to_role(resume_data, profile)
                matches.append(match)
        
        matches.sort(key=lambda x: x.fit_score, reverse=True)
        return matches
    
    def update_weights(self, new_weights: Dict[str, float]):
        """Update scoring weights"""
        total = sum(new_weights.values())
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Weights must sum to 1.0, got {total}")
        
        self.weights = new_weights
        logger.info("weights_updated", weights=new_weights)
