"""
AI-powered job matching service using NLP and machine learning.
Modernized async version of job_matcher.py.
"""
import asyncio
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import structlog

# NLP and ML libraries
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Import resume parser service
from .resume_parser_service import ResumeParser, ResumeData

logger = structlog.get_logger(__name__)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    logger.info("downloading_nltk_punkt")
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
    except Exception as e:
        logger.error("failed_to_download_punkt", error=str(e))

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    logger.info("downloading_nltk_stopwords")
    try:
        nltk.download('stopwords', quiet=True)
    except Exception as e:
        logger.error("failed_to_download_stopwords", error=str(e))


@dataclass
class MatchResult:
    """Job matching result"""
    overall_score: float
    similarity_score: float
    skills_match_percentage: float
    experience_match_score: float
    keyword_match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    recommended_skills: List[str]
    top_keywords: List[str]
    match_category: str
    recommendation: str
    details: Dict[str, Any]


class JobMatchingService:
    """
    Service for analyzing and matching job descriptions with resumes.
    Uses NLP (spaCy) and machine learning for intelligent matching.
    Delegates resume parsing to ResumeParser service.
    """
    
    def __init__(
        self, 
        resume_text: str = None, 
        resume_path: str = None,
        resume_parser: Optional[ResumeParser] = None
    ):
        """
        Initialize the matching service.
        
        Args:
            resume_text: Resume as plain text
            resume_path: Path to resume file
            resume_parser: Optional ResumeParser instance (creates new if not provided)
        """
        logger.info("initializing_job_matching_service")
        
        # Initialize or use provided resume parser
        self.resume_parser = resume_parser or ResumeParser()
        
        # Load spaCy model (for job description analysis)
        try:
            self.nlp = spacy.load('en_core_web_md')
            logger.info("spacy_model_loaded", model="en_core_web_md")
        except OSError:
            logger.warning("spacy_model_not_found", model="en_core_web_md")
            logger.info("downloading_spacy_model")
            import subprocess
            subprocess.run(['python', '-m', 'spacy', 'download', 'en_core_web_md'])
            self.nlp = spacy.load('en_core_web_md')
        
        # Initialize TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
        
        # Parse resume using the resume parser service
        if resume_text:
            self.resume_data = self.resume_parser.parse_from_text(resume_text)
            self.resume_text = resume_text
        elif resume_path:
            self.resume_data = self.resume_parser.parse_from_file(resume_path)
            self.resume_text = self.resume_data.full_text
        else:
            self.resume_data = ResumeData(
                full_text="",
                skills=[],
                years_experience=0,
                education=[],
                entities={}
            )
            self.resume_text = ""
        
        # Stop words
        self.stop_words = set(stopwords.words('english'))
        
        logger.info(
            "service_initialized",
            resume_length=len(self.resume_text),
            skills_found=len(self.resume_data.skills),
            years_exp=self.resume_data.years_experience
        )
    
    async def analyze_job(
        self,
        job_description: str,
        job_title: str = "",
        required_years: Optional[int] = None
    ) -> MatchResult:
        """
        Analyze a job and calculate match score.
        
        Args:
            job_description: Job description text
            job_title: Job title
            required_years: Required years of experience (optional)
            
        Returns:
            MatchResult object
        """
        # Run CPU-intensive operations in thread pool
        loop = asyncio.get_event_loop()
        
        # Extract job requirements using resume parser's skill extraction
        job_skills = await loop.run_in_executor(
            None, self.resume_parser._extract_skills, job_description
        )
        
        if required_years is None:
            required_years = await loop.run_in_executor(
                None, self.resume_parser._extract_years_experience, job_description
            )
        
        # Calculate different match scores
        skill_match = self._calculate_skill_match(job_skills)
        experience_match = self._calculate_experience_match(required_years)
        
        # Semantic similarity (CPU intensive)
        semantic_similarity = await loop.run_in_executor(
            None, self._calculate_semantic_similarity, job_description
        )
        
        # Keyword match (CPU intensive)
        keyword_result = await loop.run_in_executor(
            None, self._calculate_keyword_match, job_description
        )
        
        # Calculate overall score (weighted average)
        weights = {
            'skills': 0.35,
            'experience': 0.20,
            'semantic': 0.25,
            'keywords': 0.20
        }
        
        overall_score = (
            skill_match['score'] * weights['skills'] +
            experience_match['score'] * weights['experience'] +
            semantic_similarity * weights['semantic'] +
            keyword_result['score'] * weights['keywords']
        )
        
        # Determine category
        if overall_score >= 0.75:
            category = 'excellent'
        elif overall_score >= 0.60:
            category = 'good'
        elif overall_score >= 0.40:
            category = 'fair'
        else:
            category = 'poor'
        
        # Generate recommendation
        recommendation = self._generate_recommendation(overall_score, skill_match)
        
        # Identify recommended skills to learn
        recommended_skills = self._identify_recommended_skills(
            skill_match['missing'][:5]
        )
        
        return MatchResult(
            overall_score=round(overall_score, 3),
            similarity_score=round(semantic_similarity, 3),
            skills_match_percentage=round(skill_match['match_percentage'], 1),
            experience_match_score=round(experience_match['score'], 3),
            keyword_match_score=round(keyword_result['score'], 3),
            matching_skills=skill_match['matched'],
            missing_skills=skill_match['missing'],
            recommended_skills=recommended_skills,
            top_keywords=keyword_result['keywords'],
            match_category=category,
            recommendation=recommendation,
            details={
                'job_title': job_title,
                'total_job_skills': len(job_skills),
                'resume_years_experience': self.resume_data.years_experience,
                'required_years_experience': required_years,
                'education_match': len(self.resume_data.education) > 0
            }
        )
    
    def _calculate_skill_match(self, job_skills: List[str]) -> Dict[str, Any]:
        """Calculate skill match percentage"""
        if not job_skills:
            return {
                'score': 1.0,
                'matched': [],
                'missing': [],
                'match_percentage': 100.0
            }
        
        resume_skills = set([s.lower() for s in self.resume_data.skills])
        job_skills_set = set([s.lower() for s in job_skills])
        
        matched = resume_skills.intersection(job_skills_set)
        missing = job_skills_set - resume_skills
        
        score = len(matched) / len(job_skills_set) if job_skills_set else 1.0
        
        return {
            'score': score,
            'matched': sorted(list(matched)),
            'missing': sorted(list(missing)),
            'match_percentage': score * 100
        }
    
    def _calculate_experience_match(self, required_years: int) -> Dict[str, Any]:
        """Calculate experience match"""
        resume_years = self.resume_data.years_experience
        
        if required_years == 0:
            score = 1.0
            message = "No specific experience requirement"
        elif resume_years >= required_years:
            score = 1.0
            message = f"Meets requirement ({resume_years} >= {required_years} years)"
        else:
            score = resume_years / required_years if required_years > 0 else 0
            message = f"Below requirement ({resume_years} < {required_years} years)"
        
        return {
            'score': score,
            'resume_years': resume_years,
            'required_years': required_years,
            'message': message
        }
    
    def _calculate_semantic_similarity(self, job_description: str) -> float:
        """Calculate semantic similarity using spaCy word embeddings"""
        if not self.resume_text or not job_description:
            return 0.0
        
        try:
            resume_doc = self.nlp(self.resume_text[:1000000])  # Limit size
            job_doc = self.nlp(job_description[:1000000])
            
            similarity = resume_doc.similarity(job_doc)
            return max(0.0, min(1.0, similarity))  # Clamp between 0 and 1
        except Exception as e:
            logger.error("semantic_similarity_failed", error=str(e))
            return 0.0
    
    def _calculate_keyword_match(self, job_description: str) -> Dict[str, Any]:
        """Calculate keyword match using TF-IDF"""
        if not self.resume_text or not job_description:
            return {'score': 0.0, 'keywords': []}
        
        try:
            corpus = [self.resume_text, job_description]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Get top matching keywords
            feature_names = self.vectorizer.get_feature_names_out()
            resume_scores = tfidf_matrix[0].toarray()[0]
            job_scores = tfidf_matrix[1].toarray()[0]
            
            common_keywords = []
            for i, (r_score, j_score) in enumerate(zip(resume_scores, job_scores)):
                if r_score > 0 and j_score > 0:
                    common_keywords.append((feature_names[i], min(r_score, j_score)))
            
            common_keywords.sort(key=lambda x: x[1], reverse=True)
            top_keywords = [kw for kw, score in common_keywords[:10]]
            
            return {
                'score': similarity,
                'keywords': top_keywords
            }
        except Exception as e:
            logger.error("keyword_match_failed", error=str(e))
            return {'score': 0.0, 'keywords': []}
    
    def _identify_recommended_skills(self, missing_skills: List[str]) -> List[str]:
        """Identify which missing skills are most important to learn"""
        # Priority skills by category
        priority_skills = {
            'cloud': ['aws', 'azure', 'docker', 'kubernetes'],
            'data': ['sql', 'python', 'pandas', 'machine learning'],
            'web': ['react', 'javascript', 'node.js', 'api'],
            'devops': ['git', 'ci/cd', 'jenkins', 'terraform']
        }
        
        recommended = []
        for category, skills in priority_skills.items():
            for skill in skills:
                if skill in missing_skills and skill not in recommended:
                    recommended.append(skill)
                if len(recommended) >= 5:
                    break
            if len(recommended) >= 5:
                break
        
        # If we didn't find enough priority skills, add remaining
        for skill in missing_skills:
            if skill not in recommended:
                recommended.append(skill)
            if len(recommended) >= 5:
                break
        
        return recommended
    
    def _generate_recommendation(
        self, 
        overall_score: float, 
        skill_match: Dict[str, Any]
    ) -> str:
        """Generate human-readable recommendation"""
        score_pct = overall_score * 100
        skill_pct = skill_match['match_percentage']
        
        if overall_score >= 0.80:
            return (
                f"🟢 HIGHLY RECOMMENDED - Excellent {score_pct:.0f}% match! "
                f"You have {len(skill_match['matched'])} matching skills. Apply immediately!"
            )
        elif overall_score >= 0.70:
            return (
                f"🟢 STRONGLY RECOMMENDED - Very good {score_pct:.0f}% match. "
                f"Strong skill alignment ({skill_pct:.0f}%). Great opportunity!"
            )
        elif overall_score >= 0.60:
            return (
                f"🟡 RECOMMENDED - Good {score_pct:.0f}% match. "
                f"Consider applying. You may need to highlight transferable skills."
            )
        elif overall_score >= 0.50:
            return (
                f"🟡 POSSIBLE - Moderate {score_pct:.0f}% match. "
                f"Consider if you can quickly acquire missing skills."
            )
        elif overall_score >= 0.40:
            return (
                f"🟠 STRETCH - Fair {score_pct:.0f}% match. "
                f"Significant skill gaps. Consider for learning opportunity."
            )
        else:
            return (
                f"🔴 NOT RECOMMENDED - Low {score_pct:.0f}% match. "
                f"Major skill gaps. Focus on closer matches or skill development."
            )
    
    async def batch_analyze_jobs(
        self, 
        jobs: List[Dict[str, str]]
    ) -> List[Tuple[Dict[str, str], MatchResult]]:
        """
        Analyze multiple jobs concurrently.
        
        Args:
            jobs: List of job dictionaries with 'description' and 'title' keys
            
        Returns:
            List of (job_dict, match_result) tuples sorted by score
        """
        logger.info("batch_analyzing_jobs", count=len(jobs))
        
        # Analyze all jobs concurrently
        tasks = []
        for job in jobs:
            description = job.get('description', '')
            title = job.get('title', '')
            
            if description:
                tasks.append(self.analyze_job(description, title))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine jobs with results
        analyzed_jobs = []
        for job, result in zip(jobs, results):
            if isinstance(result, Exception):
                logger.error("job_analysis_failed", job_title=job.get('title'), error=str(result))
                continue
            analyzed_jobs.append((job, result))
        
        # Sort by match score
        analyzed_jobs.sort(key=lambda x: x[1].overall_score, reverse=True)
        
        logger.info("batch_analysis_complete", successful=len(analyzed_jobs))
        return analyzed_jobs
    
    def get_resume_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the parsed resume data.
        
        Returns:
            Dictionary with resume summary
        """
        return self.resume_parser.get_summary(self.resume_data)
    
    def update_resume(self, resume_text: str = None, resume_path: str = None):
        """
        Update the resume being used for matching.
        
        Args:
            resume_text: New resume text
            resume_path: New resume file path
        """
        if resume_text:
            self.resume_data = self.resume_parser.parse_from_text(resume_text)
            self.resume_text = resume_text
        elif resume_path:
            self.resume_data = self.resume_parser.parse_from_file(resume_path)
            self.resume_text = self.resume_data.full_text
        
        logger.info(
            "resume_updated",
            skills_found=len(self.resume_data.skills),
            years_exp=self.resume_data.years_experience
        )
    
    def to_dict(self, match_result: MatchResult) -> Dict[str, Any]:
        """Convert MatchResult to dictionary"""
        return asdict(match_result)


# Utility function for quick matching
async def quick_match(resume_path: str, job_description: str, job_title: str = "") -> MatchResult:
    """
    Quick utility function to match a job with a resume.
    
    Args:
        resume_path: Path to resume file
        job_description: Job description text
        job_title: Job title
        
    Returns:
        MatchResult object
    """
    matcher = JobMatchingService(resume_path=resume_path)
    return await matcher.analyze_job(job_description, job_title)
