"""
Career recommendation service using semantic matching and ML-based scoring.
Analyzes resumes and recommends best-fit roles with skill gap analysis.
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from pathlib import Path
import structlog
import json

from src.services.resume_parser_service import ResumeParser, ResumeData
from src.services.role_profiles_service import RoleProfileDatabase, RoleProfile
from src.repositories.career_recommendation_repository import (
    ResumeAnalysisRepository,
    RoleRecommendationRepository,
    SkillEmbeddingRepository,
    CareerPathwayRepository
)
from src.models.career_recommendation import (
    ResumeAnalysis,
    RoleRecommendation
)

logger = structlog.get_logger(__name__)


@dataclass
class RoleMatch:
    """Data class for role matching results"""
    role_profile: RoleProfile
    overall_score: float
    skills_score: float
    education_score: float
    certification_score: float
    experience_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    matched_certifications: List[str]
    missing_certifications: List[str]
    skill_gaps: List[str]
    recommendations: List[str]


@dataclass
class CareerRecommendation:
    """Complete career recommendation report"""
    resume_data: ResumeData
    top_roles: List[RoleMatch]
    career_pathways: Dict[str, List[str]]
    overall_insights: Dict[str, any]


class CareerRecommendationService:
    """
    Service for analyzing resumes and recommending career paths.
    Uses semantic similarity and weighted scoring for intelligent matching.
    """
    
    # Scoring weights (must sum to 1.0)
    WEIGHT_SKILLS = 0.40
    WEIGHT_EXPERIENCE = 0.25
    WEIGHT_EDUCATION = 0.20
    WEIGHT_CERTIFICATION = 0.15
    
    def __init__(
        self,
        resume_parser: Optional[ResumeParser] = None,
        role_database: Optional[RoleProfileDatabase] = None,
        use_embeddings: bool = False,
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        """Initialize the career recommendation service."""
        self.resume_parser = resume_parser or ResumeParser()
        self.role_database = role_database or RoleProfileDatabase()
        self.use_embeddings = use_embeddings
        self.embedding_model_name = embedding_model
        
        self.embedding_model = None
        if use_embeddings:
            try:
                from sentence_transformers import SentenceTransformer
                self.embedding_model = SentenceTransformer(embedding_model)
                logger.info("embedding_model_loaded", model=embedding_model)
            except ImportError:
                logger.warning("sentence_transformers_not_installed")
                self.use_embeddings = False
            except Exception as e:
                logger.error("embedding_model_load_failed", error=str(e))
                self.use_embeddings = False
        
        logger.info("career_recommendation_service_initialized", use_embeddings=self.use_embeddings)
    
    def analyze_resume_file(self, file_path: str) -> CareerRecommendation:
        """Analyze a resume file and generate career recommendations."""
        logger.info("analyzing_resume_file", path=file_path)
        resume_data = self.resume_parser.parse_from_file(file_path)
        return self.generate_recommendations(resume_data)
    
    def analyze_resume_text(self, text: str) -> CareerRecommendation:
        """Analyze resume text and generate career recommendations."""
        logger.info("analyzing_resume_text", length=len(text))
        resume_data = self.resume_parser.parse_from_text(text)
        return self.generate_recommendations(resume_data)
    
    def generate_recommendations(self, resume_data: ResumeData, top_n: int = 10) -> CareerRecommendation:
        """Generate career recommendations for parsed resume data."""
        logger.info("generating_recommendations", skills_count=len(resume_data.skills))
        
        all_matches = []
        for profile in self.role_database.get_all_profiles():
            match = self._match_resume_to_role(resume_data, profile)
            all_matches.append(match)
        
        all_matches.sort(key=lambda m: m.overall_score, reverse=True)
        top_roles = all_matches[:top_n]
        
        pathways = self._generate_career_pathways(top_roles)
        insights = self._generate_insights(resume_data, top_roles)
        
        logger.info("recommendations_generated", 
                   top_role=top_roles[0].role_profile.title if top_roles else "None",
                   top_score=top_roles[0].overall_score if top_roles else 0.0)
        
        return CareerRecommendation(
            resume_data=resume_data,
            top_roles=top_roles,
            career_pathways=pathways,
            overall_insights=insights
        )
    
    def _match_resume_to_role(self, resume_data: ResumeData, role_profile: RoleProfile) -> RoleMatch:
        """Match a resume against a specific role profile."""
        skills_score, matched_skills, missing_skills = self._score_skills(
            resume_data.skills, role_profile.required_skills, role_profile.preferred_skills
        )
        
        education_score = self._score_education(resume_data.education, role_profile.required_education)
        
        cert_score, matched_certs, missing_certs = self._score_certifications(
            resume_data.certifications or [],
            role_profile.required_certifications,
            role_profile.preferred_certifications
        )
        
        experience_score = self._score_experience(
            resume_data.years_experience,
            role_profile.min_years_experience,
            role_profile.avg_years_experience
        )
        
        overall_score = (
            self.WEIGHT_SKILLS * skills_score +
            self.WEIGHT_EDUCATION * education_score +
            self.WEIGHT_CERTIFICATION * cert_score +
            self.WEIGHT_EXPERIENCE * experience_score
        )
        
        skill_gaps = self._identify_skill_gaps(
            resume_data.skills, role_profile.required_skills, role_profile.preferred_skills
        )
        
        recommendations = self._generate_role_recommendations(resume_data, role_profile, skill_gaps)
        
        return RoleMatch(
            role_profile=role_profile,
            overall_score=overall_score,
            skills_score=skills_score,
            education_score=education_score,
            certification_score=cert_score,
            experience_score=experience_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            matched_certifications=matched_certs,
            missing_certifications=missing_certs,
            skill_gaps=skill_gaps,
            recommendations=recommendations
        )
    
    def _score_skills(self, resume_skills: List[str], required_skills: List[str], 
                     preferred_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        """Score skills match using keyword or semantic matching."""
        if not resume_skills:
            return 0.0, [], required_skills
        
        resume_skills_lower = [s.lower() for s in resume_skills]
        required_lower = [s.lower() for s in required_skills]
        preferred_lower = [s.lower() for s in preferred_skills]
        
        if self.use_embeddings and self.embedding_model:
            return self._semantic_skill_matching(resume_skills_lower, required_lower, preferred_lower)
        else:
            return self._keyword_skill_matching(resume_skills_lower, required_lower, preferred_lower)
    
    def _keyword_skill_matching(self, resume_skills: List[str], required_skills: List[str], 
                                preferred_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        """Keyword-based skill matching"""
        matched_required = []
        missing_required = []
        
        for skill in required_skills:
            if any(skill in resume_skill or resume_skill in skill for resume_skill in resume_skills):
                matched_required.append(skill)
            else:
                missing_required.append(skill)
        
        matched_preferred = []
        for skill in preferred_skills:
            if any(skill in resume_skill or resume_skill in skill for resume_skill in resume_skills):
                matched_preferred.append(skill)
        
        required_score = len(matched_required) / max(len(required_skills), 1)
        preferred_score = len(matched_preferred) / max(len(preferred_skills), 1)
        final_score = 0.7 * required_score + 0.3 * preferred_score
        
        return final_score, matched_required + matched_preferred, missing_required
    
    def _semantic_skill_matching(self, resume_skills: List[str], required_skills: List[str], 
                                preferred_skills: List[str], threshold: float = 0.6) -> Tuple[float, List[str], List[str]]:
        """Semantic similarity-based skill matching using embeddings"""
        try:
            resume_embeddings = self.embedding_model.encode(resume_skills)
            required_embeddings = self.embedding_model.encode(required_skills)
            preferred_embeddings = self.embedding_model.encode(preferred_skills) if preferred_skills else []
            
            matched_required = []
            missing_required = []
            
            for i, req_skill in enumerate(required_skills):
                req_emb = required_embeddings[i]
                similarities = [self._cosine_similarity(req_emb, resume_emb) for resume_emb in resume_embeddings]
                max_sim = max(similarities) if similarities else 0.0
                
                if max_sim >= threshold:
                    matched_required.append(req_skill)
                else:
                    missing_required.append(req_skill)
            
            matched_preferred = []
            if len(preferred_embeddings) > 0:
                for i, pref_skill in enumerate(preferred_skills):
                    pref_emb = preferred_embeddings[i]
                    similarities = [self._cosine_similarity(pref_emb, resume_emb) for resume_emb in resume_embeddings]
                    max_sim = max(similarities) if similarities else 0.0
                    
                    if max_sim >= threshold:
                        matched_preferred.append(pref_skill)
            
            required_score = len(matched_required) / max(len(required_skills), 1)
            preferred_score = len(matched_preferred) / max(len(preferred_skills), 1) if preferred_skills else 0.0
            final_score = 0.7 * required_score + 0.3 * preferred_score
            
            return final_score, matched_required + matched_preferred, missing_required
            
        except Exception as e:
            logger.error("semantic_matching_failed", error=str(e))
            return self._keyword_skill_matching(resume_skills, required_skills, preferred_skills)
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        return dot_product / (norm1 * norm2) if norm1 and norm2 else 0.0
    
    def _score_education(self, resume_education: List[str], required_education: List[str]) -> float:
        """Score education match"""
        if not required_education:
            return 1.0
        if not resume_education:
            return 0.0
        
        education_keywords = {
            'phd': ['phd', 'doctorate', 'doctoral'],
            'master': ['master', 'ms', 'm.s.', 'ma', 'm.a.', 'mba'],
            'bachelor': ['bachelor', 'bs', 'b.s.', 'ba', 'b.a.'],
            'associate': ['associate'],
        }
        
        resume_text = ' '.join(resume_education).lower()
        required_text = ' '.join(required_education).lower()
        
        resume_level = 0
        if any(kw in resume_text for kw in education_keywords['phd']):
            resume_level = 4
        elif any(kw in resume_text for kw in education_keywords['master']):
            resume_level = 3
        elif any(kw in resume_text for kw in education_keywords['bachelor']):
            resume_level = 2
        elif any(kw in resume_text for kw in education_keywords['associate']):
            resume_level = 1
        
        required_level = 0
        if any(kw in required_text for kw in education_keywords['phd']):
            required_level = 4
        elif any(kw in required_text for kw in education_keywords['master']):
            required_level = 3
        elif any(kw in required_text for kw in education_keywords['bachelor']):
            required_level = 2
        elif any(kw in required_text for kw in education_keywords['associate']):
            required_level = 1
        
        if resume_level >= required_level:
            return 1.0
        elif resume_level == required_level - 1:
            return 0.7
        elif resume_level > 0:
            return 0.4
        return 0.0
    
    def _score_certifications(self, resume_certs: List[str], required_certs: List[str], 
                             preferred_certs: List[str]) -> Tuple[float, List[str], List[str]]:
        """Score certifications match"""
        if not required_certs and not preferred_certs:
            return 1.0, [], []
        if not resume_certs:
            return 0.0, [], required_certs
        
        resume_text = ' '.join(resume_certs).lower()
        
        matched_required = [cert for cert in required_certs if cert.lower() in resume_text]
        missing_required = [cert for cert in required_certs if cert.lower() not in resume_text]
        matched_preferred = [cert for cert in preferred_certs if cert.lower() in resume_text]
        
        required_score = len(matched_required) / max(len(required_certs), 1) if required_certs else 1.0
        preferred_score = len(matched_preferred) / max(len(preferred_certs), 1) if preferred_certs else 0.0
        final_score = 0.8 * required_score + 0.2 * preferred_score
        
        return final_score, matched_required + matched_preferred, missing_required
    
    def _score_experience(self, resume_years: int, min_required: int, avg_years: int) -> float:
        """Score years of experience"""
        if resume_years >= avg_years:
            return 1.0
        elif resume_years >= min_required:
            return 0.7 + 0.3 * (resume_years - min_required) / max(avg_years - min_required, 1)
        elif resume_years > 0:
            return 0.5 * (resume_years / max(min_required, 1))
        return 0.0
    
    def _identify_skill_gaps(self, resume_skills: List[str], required_skills: List[str], 
                            preferred_skills: List[str]) -> List[str]:
        """Identify critical skill gaps"""
        resume_skills_lower = [s.lower() for s in resume_skills]
        
        gaps = [skill for skill in required_skills 
                if not any(skill.lower() in rs or rs in skill.lower() for rs in resume_skills_lower)]
        
        missing_preferred = [skill for skill in preferred_skills 
                           if not any(skill.lower() in rs or rs in skill.lower() for rs in resume_skills_lower)]
        
        gaps.extend(missing_preferred[:3])
        return gaps
    
    def _generate_role_recommendations(self, resume_data: ResumeData, role_profile: RoleProfile, 
                                      skill_gaps: List[str]) -> List[str]:
        """Generate actionable recommendations for a role"""
        recommendations = []
        
        if skill_gaps:
            recommendations.append(f"Focus on developing: {', '.join(skill_gaps[:3])}")
        
        if role_profile.required_certifications:
            resume_cert_text = ' '.join(resume_data.certifications or []).lower()
            missing_certs = [cert for cert in role_profile.required_certifications 
                           if cert.lower() not in resume_cert_text]
            if missing_certs:
                recommendations.append(f"Consider obtaining: {', '.join(missing_certs[:2])}")
        
        if resume_data.years_experience < role_profile.min_years_experience:
            years_needed = role_profile.min_years_experience - resume_data.years_experience
            recommendations.append(f"Gain {years_needed} more year(s) of relevant experience")
        
        if role_profile.growth_areas:
            recommendations.append(f"Emerging skills to learn: {', '.join(role_profile.growth_areas[:2])}")
        
        return recommendations
    
    def _generate_career_pathways(self, top_roles: List[RoleMatch]) -> Dict[str, List[str]]:
        """Generate career pathway suggestions"""
        if not top_roles:
            return {}
        
        pathways = {}
        for i, match in enumerate(top_roles[:3], 1):
            role_profile = match.role_profile
            pathways[f"Path {i}: {role_profile.title}"] = [
                f"Current role fit: {match.overall_score:.1%}",
                f"From: {', '.join(role_profile.career_path_from) if role_profile.career_path_from else 'Entry level'}",
                f"To: {', '.join(role_profile.career_path_to[:2]) if role_profile.career_path_to else 'Senior positions'}",
                f"Related roles: {', '.join(role_profile.related_roles[:2]) if role_profile.related_roles else 'N/A'}"
            ]
        
        return pathways
    
    def _generate_insights(self, resume_data: ResumeData, top_roles: List[RoleMatch]) -> Dict[str, any]:
        """Generate overall career insights"""
        if not top_roles:
            return {}
        
        best_match = top_roles[0]
        
        scores = {
            'Skills': best_match.skills_score,
            'Experience': best_match.experience_score,
            'Education': best_match.education_score,
            'Certifications': best_match.certification_score
        }
        
        strongest = max(scores.items(), key=lambda x: x[1])
        weakest = min(scores.items(), key=lambda x: x[1])
        
        categories = {}
        for match in top_roles:
            cat = match.role_profile.category
            categories[cat] = categories.get(cat, 0) + 1
        
        top_category = max(categories.items(), key=lambda x: x[1])[0] if categories else "Unknown"
        
        return {
            'best_fit_role': best_match.role_profile.title,
            'best_fit_score': best_match.overall_score,
            'strongest_area': strongest[0],
            'strongest_score': strongest[1],
            'area_to_improve': weakest[0],
            'improvement_score': weakest[1],
            'top_category': top_category,
            'total_skills': len(resume_data.skills),
            'years_experience': resume_data.years_experience,
            'career_stage': self._determine_career_stage(resume_data.years_experience),
            'recommendations_summary': f"You're a strong match for {best_match.role_profile.category} roles, especially {best_match.role_profile.title}"
        }
    
    def _determine_career_stage(self, years: int) -> str:
        """Determine career stage from years of experience"""
        if years == 0:
            return "Entry Level"
        elif years <= 2:
            return "Junior"
        elif years <= 5:
            return "Mid-Level"
        elif years <= 10:
            return "Senior"
        return "Lead/Principal"
    
    async def save_analysis(self, resume_data: ResumeData, recommendations: CareerRecommendation,
                          resume_repo: ResumeAnalysisRepository, recommendation_repo: RoleRecommendationRepository,
                          user_email: Optional[str] = None, resume_filename: Optional[str] = None) -> ResumeAnalysis:
        """Save resume analysis and recommendations to database."""
        logger.info("saving_analysis_to_database")
        
        resume_analysis = ResumeAnalysis(
            user_email=user_email,
            resume_text=resume_data.full_text,
            resume_filename=resume_filename,
            skills=resume_data.skills,
            education=resume_data.education,
            certifications=resume_data.certifications or [],
            experience_years=resume_data.years_experience,
            contact_info=resume_data.contact_info,
            entities=resume_data.entities
        )
        
        resume_analysis = await resume_repo.create(resume_analysis)
        
        for rank, role_match in enumerate(recommendations.top_roles, 1):
            recommendation = RoleRecommendation(
                resume_analysis_id=resume_analysis.id,
                role_id=role_match.role_profile.role_id,
                role_title=role_match.role_profile.title,
                role_category=role_match.role_profile.category,
                overall_fit_score=role_match.overall_score,
                skills_score=role_match.skills_score,
                education_score=role_match.education_score,
                certification_score=role_match.certification_score,
                experience_score=role_match.experience_score,
                matched_skills=role_match.matched_skills,
                missing_skills=role_match.missing_skills,
                matched_certifications=role_match.matched_certifications,
                missing_certifications=role_match.missing_certifications,
                skill_gaps=role_match.skill_gaps,
                growth_recommendations=role_match.recommendations,
                career_path_suggestions={
                    'from': role_match.role_profile.career_path_from,
                    'to': role_match.role_profile.career_path_to,
                    'related': role_match.role_profile.related_roles
                },
                rank=rank
            )
            await recommendation_repo.create(recommendation)
        
        logger.info("analysis_saved", analysis_id=resume_analysis.id, 
                   recommendations_count=len(recommendations.top_roles))
        return resume_analysis
    
    def export_report(self, recommendations: CareerRecommendation, output_path: str, format: str = 'markdown'):
        """Export recommendation report to file."""
        logger.info("exporting_report", path=output_path, format=format)
        
        if format == 'markdown':
            self._export_markdown(recommendations, output_path)
        elif format == 'json':
            self._export_json(recommendations, output_path)
        elif format == 'txt':
            self._export_text(recommendations, output_path)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        logger.info("report_exported", path=output_path)
    
    def _export_markdown(self, recommendations: CareerRecommendation, output_path: str):
        """Export report as Markdown"""
        content = f"""# Career Recommendation Report

## Resume Summary
- **Total Skills**: {len(recommendations.resume_data.skills)}
- **Years of Experience**: {recommendations.resume_data.years_experience}
- **Education**: {len(recommendations.resume_data.education)} entries
- **Certifications**: {len(recommendations.resume_data.certifications or [])} found

## Overall Insights
```json
{json.dumps(recommendations.overall_insights, indent=2)}
```

## Top Role Recommendations

"""
        
        for i, match in enumerate(recommendations.top_roles[:5], 1):
            content += f"""### {i}. {match.role_profile.title}
- **Overall Fit**: {match.overall_score:.1%}
- **Category**: {match.role_profile.category}
- **Skills Match**: {match.skills_score:.1%}
- **Experience Match**: {match.experience_score:.1%}
- **Education Match**: {match.education_score:.1%}
- **Certification Match**: {match.certification_score:.1%}

**Matched Skills**: {', '.join(match.matched_skills[:10])}

**Missing Skills**: {', '.join(match.missing_skills[:5])}

**Recommendations**:
{chr(10).join(f'- {rec}' for rec in match.recommendations)}

---

"""
        
        content += """## Career Pathways

"""
        for path_name, path_info in recommendations.career_pathways.items():
            content += f"""### {path_name}
{chr(10).join(f'- {info}' for info in path_info)}

"""
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _export_json(self, recommendations: CareerRecommendation, output_path: str):
        """Export report as JSON"""
        data = {
            'resume_summary': {
                'total_skills': len(recommendations.resume_data.skills),
                'years_experience': recommendations.resume_data.years_experience,
                'education_count': len(recommendations.resume_data.education),
                'certifications_count': len(recommendations.resume_data.certifications or [])
            },
            'overall_insights': recommendations.overall_insights,
            'top_roles': [
                {
                    'rank': i,
                    'title': match.role_profile.title,
                    'category': match.role_profile.category,
                    'overall_score': match.overall_score,
                    'skills_score': match.skills_score,
                    'experience_score': match.experience_score,
                    'education_score': match.education_score,
                    'certification_score': match.certification_score,
                    'matched_skills': match.matched_skills,
                    'missing_skills': match.missing_skills,
                    'skill_gaps': match.skill_gaps,
                    'recommendations': match.recommendations
                }
                for i, match in enumerate(recommendations.top_roles, 1)
            ],
            'career_pathways': recommendations.career_pathways
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    
    def _export_text(self, recommendations: CareerRecommendation, output_path: str):
        """Export report as plain text"""
        content = "CAREER RECOMMENDATION REPORT\n"
        content += "=" * 60 + "\n\n"
        
        content += "RESUME SUMMARY\n"
        content += "-" * 60 + "\n"
        content += f"Total Skills: {len(recommendations.resume_data.skills)}\n"
        content += f"Years of Experience: {recommendations.resume_data.years_experience}\n"
        content += f"Education Entries: {len(recommendations.resume_data.education)}\n"
        content += f"Certifications: {len(recommendations.resume_data.certifications or [])}\n\n"
        
        content += "TOP ROLE RECOMMENDATIONS\n"
        content += "=" * 60 + "\n\n"
        
        for i, match in enumerate(recommendations.top_roles[:5], 1):
            content += f"{i}. {match.role_profile.title}\n"
            content += "-" * 60 + "\n"
            content += f"Overall Fit: {match.overall_score:.1%}\n"
            content += f"Category: {match.role_profile.category}\n"
            content += f"Skills Match: {match.skills_score:.1%}\n"
            content += f"Experience Match: {match.experience_score:.1%}\n"
            content += f"Education Match: {match.education_score:.1%}\n"
            content += f"Certification Match: {match.certification_score:.1%}\n\n"
            
            content += f"Matched Skills: {', '.join(match.matched_skills[:10])}\n\n"
            content += f"Missing Skills: {', '.join(match.missing_skills[:5])}\n\n"
            
            content += "Recommendations:\n"
            for rec in match.recommendations:
                content += f"  - {rec}\n"
            content += "\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
