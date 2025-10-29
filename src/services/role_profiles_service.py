"""
Role profiles database for career matching and recommendations.
Contains structured definitions of various tech roles with requirements.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum
import json
from pathlib import Path
import structlog

logger = structlog.get_logger(__name__)


class ExperienceLevel(str, Enum):
    """Experience level classification"""
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"


@dataclass
class RoleProfile:
    """Structured role profile definition"""
    role_id: str
    title: str
    category: str  # e.g., "Security", "Development", "Data"
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    required_certifications: List[str] = field(default_factory=list)
    preferred_certifications: List[str] = field(default_factory=list)
    required_education: List[str] = field(default_factory=list)
    min_years_experience: int = 0
    avg_years_experience: int = 2
    typical_salary_range: Dict[str, int] = field(default_factory=dict)
    growth_areas: List[str] = field(default_factory=list)
    related_roles: List[str] = field(default_factory=list)
    career_path_from: List[str] = field(default_factory=list)
    career_path_to: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    responsibilities: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'role_id': self.role_id,
            'title': self.title,
            'category': self.category,
            'description': self.description,
            'required_skills': self.required_skills,
            'preferred_skills': self.preferred_skills,
            'required_certifications': self.required_certifications,
            'preferred_certifications': self.preferred_certifications,
            'required_education': self.required_education,
            'min_years_experience': self.min_years_experience,
            'avg_years_experience': self.avg_years_experience,
            'typical_salary_range': self.typical_salary_range,
            'growth_areas': self.growth_areas,
            'related_roles': self.related_roles,
            'career_path_from': self.career_path_from,
            'career_path_to': self.career_path_to,
            'keywords': self.keywords,
            'responsibilities': self.responsibilities
        }


class RoleProfileDatabase:
    """Database of role profiles for matching"""
    
    def __init__(self, custom_profiles_path: Optional[str] = None):
        """
        Initialize role profile database.
        
        Args:
            custom_profiles_path: Optional path to custom profiles JSON file
        """
        self.profiles: Dict[str, RoleProfile] = {}
        self._load_default_profiles()
        
        if custom_profiles_path:
            self._load_custom_profiles(custom_profiles_path)
        
        logger.info("role_database_initialized", profile_count=len(self.profiles))
    
    def _load_default_profiles(self):
        """Load built-in role profiles"""
        
        # Software Engineering Roles
        self.add_profile(RoleProfile(
            role_id="software_engineer",
            title="Software Engineer",
            category="Development",
            description="Design, develop, and maintain software applications",
            required_skills=["python", "java", "javascript", "git", "sql", "rest api"],
            preferred_skills=["docker", "kubernetes", "ci/cd", "aws", "react", "node.js"],
            required_certifications=[],
            preferred_certifications=["AWS Certified Developer", "Azure Developer"],
            required_education=["Bachelor's in Computer Science or related field"],
            min_years_experience=0,
            avg_years_experience=2,
            typical_salary_range={"min": 70000, "max": 150000, "mid": 100000},
            growth_areas=["cloud computing", "microservices", "devops"],
            related_roles=["full_stack_developer", "backend_developer", "frontend_developer"],
            career_path_from=["junior_developer", "intern"],
            career_path_to=["senior_engineer", "tech_lead", "architect"],
            keywords=["coding", "development", "programming", "software"],
            responsibilities=[
                "Write clean, maintainable code",
                "Design software solutions",
                "Debug and fix issues",
                "Collaborate with cross-functional teams",
                "Participate in code reviews"
            ]
        ))
        
        # IT Auditor
        self.add_profile(RoleProfile(
            role_id="it_auditor",
            title="IT Auditor",
            category="Security & Compliance",
            description="Evaluate IT systems, controls, and compliance with standards",
            required_skills=["risk assessment", "governance", "controls testing", "compliance", "documentation"],
            preferred_skills=["sql", "python", "data analysis", "it frameworks", "security auditing"],
            required_certifications=["CISA", "CIA"],
            preferred_certifications=["CISSP", "CISM", "CEH"],
            required_education=["Bachelor's in IT, Accounting, or related field"],
            min_years_experience=2,
            avg_years_experience=3,
            typical_salary_range={"min": 75000, "max": 130000, "mid": 95000},
            growth_areas=["cybersecurity", "grc tools", "cloud security"],
            related_roles=["security_analyst", "compliance_analyst", "risk_analyst"],
            career_path_from=["it_analyst", "junior_auditor"],
            career_path_to=["senior_auditor", "audit_manager", "ciso"],
            keywords=["audit", "compliance", "controls", "governance", "risk"],
            responsibilities=[
                "Conduct IT audits and assessments",
                "Test internal controls",
                "Evaluate compliance with regulations",
                "Document findings and recommendations",
                "Report to management and stakeholders"
            ]
        ))
        
        # Security Analyst
        self.add_profile(RoleProfile(
            role_id="security_analyst",
            title="Security Analyst",
            category="Security & Compliance",
            description="Monitor, detect, and respond to security threats",
            required_skills=["network security", "threat detection", "siem", "incident response", "security tools"],
            preferred_skills=["python", "powershell", "penetration testing", "forensics", "cloud security"],
            required_certifications=["CompTIA Security+"],
            preferred_certifications=["CEH", "CISSP", "GCIH", "GCIA"],
            required_education=["Bachelor's in Cybersecurity, IT, or related field"],
            min_years_experience=1,
            avg_years_experience=3,
            typical_salary_range={"min": 70000, "max": 140000, "mid": 95000},
            growth_areas=["threat intelligence", "cloud security", "automation"],
            related_roles=["soc_analyst", "incident_responder", "penetration_tester"],
            career_path_from=["it_support", "junior_analyst"],
            career_path_to=["senior_analyst", "security_engineer", "security_architect"],
            keywords=["security", "threats", "monitoring", "siem", "incidents"],
            responsibilities=[
                "Monitor security alerts and events",
                "Investigate security incidents",
                "Implement security controls",
                "Conduct vulnerability assessments",
                "Create security documentation"
            ]
        ))
        
        # Data Engineer
        self.add_profile(RoleProfile(
            role_id="data_engineer",
            title="Data Engineer",
            category="Data",
            description="Build and maintain data pipelines and infrastructure",
            required_skills=["python", "sql", "etl", "data warehousing", "big data"],
            preferred_skills=["spark", "airflow", "kafka", "aws", "azure", "snowflake"],
            required_certifications=[],
            preferred_certifications=["AWS Certified Data Analytics", "Google Cloud Data Engineer"],
            required_education=["Bachelor's in Computer Science, Data Science, or related"],
            min_years_experience=2,
            avg_years_experience=3,
            typical_salary_range={"min": 90000, "max": 170000, "mid": 120000},
            growth_areas=["real-time processing", "ml pipelines", "cloud platforms"],
            related_roles=["data_scientist", "ml_engineer", "analytics_engineer"],
            career_path_from=["data_analyst", "software_engineer"],
            career_path_to=["senior_data_engineer", "data_architect", "ml_engineer"],
            keywords=["data", "pipelines", "etl", "warehousing", "big data"],
            responsibilities=[
                "Design data pipelines",
                "Build ETL processes",
                "Optimize data storage",
                "Ensure data quality",
                "Collaborate with data scientists"
            ]
        ))
        
        # DevOps Engineer
        self.add_profile(RoleProfile(
            role_id="devops_engineer",
            title="DevOps Engineer",
            category="Infrastructure",
            description="Automate and optimize development and deployment processes",
            required_skills=["docker", "kubernetes", "ci/cd", "linux", "git", "scripting"],
            preferred_skills=["terraform", "ansible", "jenkins", "aws", "azure", "monitoring"],
            required_certifications=[],
            preferred_certifications=["AWS Certified DevOps", "CKA", "Azure DevOps Engineer"],
            required_education=["Bachelor's in Computer Science or related field"],
            min_years_experience=2,
            avg_years_experience=4,
            typical_salary_range={"min": 90000, "max": 160000, "mid": 115000},
            growth_areas=["kubernetes", "cloud native", "gitops", "sre"],
            related_roles=["sre", "cloud_engineer", "platform_engineer"],
            career_path_from=["software_engineer", "systems_administrator"],
            career_path_to=["senior_devops", "sre", "platform_architect"],
            keywords=["devops", "automation", "infrastructure", "deployment", "ci/cd"],
            responsibilities=[
                "Build CI/CD pipelines",
                "Manage infrastructure as code",
                "Automate deployment processes",
                "Monitor system performance",
                "Improve development workflows"
            ]
        ))
        
        # Full Stack Developer
        self.add_profile(RoleProfile(
            role_id="full_stack_developer",
            title="Full Stack Developer",
            category="Development",
            description="Develop both frontend and backend components of applications",
            required_skills=["javascript", "react", "node.js", "sql", "rest api", "html", "css"],
            preferred_skills=["typescript", "docker", "aws", "mongodb", "graphql", "testing"],
            required_certifications=[],
            preferred_certifications=["AWS Certified Developer"],
            required_education=["Bachelor's in Computer Science or related field"],
            min_years_experience=1,
            avg_years_experience=3,
            typical_salary_range={"min": 75000, "max": 150000, "mid": 105000},
            growth_areas=["cloud platforms", "microservices", "devops"],
            related_roles=["frontend_developer", "backend_developer", "software_engineer"],
            career_path_from=["junior_developer", "frontend_developer"],
            career_path_to=["senior_developer", "tech_lead", "architect"],
            keywords=["full stack", "frontend", "backend", "web development"],
            responsibilities=[
                "Develop user interfaces",
                "Build backend APIs",
                "Design database schemas",
                "Implement business logic",
                "Deploy and maintain applications"
            ]
        ))
        
        # Cloud Architect
        self.add_profile(RoleProfile(
            role_id="cloud_architect",
            title="Cloud Architect",
            category="Infrastructure",
            description="Design and oversee cloud infrastructure and solutions",
            required_skills=["aws", "azure", "cloud architecture", "networking", "security", "infrastructure as code"],
            preferred_skills=["kubernetes", "terraform", "serverless", "multi-cloud", "cost optimization"],
            required_certifications=["AWS Solutions Architect", "Azure Solutions Architect"],
            preferred_certifications=["Google Cloud Architect", "TOGAF"],
            required_education=["Bachelor's in Computer Science or related field"],
            min_years_experience=5,
            avg_years_experience=7,
            typical_salary_range={"min": 120000, "max": 200000, "mid": 150000},
            growth_areas=["multi-cloud", "finops", "cloud security"],
            related_roles=["solutions_architect", "enterprise_architect", "devops_engineer"],
            career_path_from=["devops_engineer", "software_engineer", "cloud_engineer"],
            career_path_to=["principal_architect", "cto", "vp_engineering"],
            keywords=["cloud", "architecture", "aws", "azure", "infrastructure"],
            responsibilities=[
                "Design cloud solutions",
                "Define architecture standards",
                "Evaluate cloud services",
                "Optimize costs and performance",
                "Guide technical teams"
            ]
        ))
        
        # Data Scientist
        self.add_profile(RoleProfile(
            role_id="data_scientist",
            title="Data Scientist",
            category="Data",
            description="Analyze data and build predictive models",
            required_skills=["python", "machine learning", "statistics", "sql", "data analysis"],
            preferred_skills=["tensorflow", "pytorch", "spark", "r", "deep learning", "nlp"],
            required_certifications=[],
            preferred_certifications=["AWS ML Specialty", "Google ML Engineer"],
            required_education=["Master's or PhD in Data Science, Statistics, or related field"],
            min_years_experience=2,
            avg_years_experience=4,
            typical_salary_range={"min": 95000, "max": 180000, "mid": 125000},
            growth_areas=["deep learning", "mlops", "ai ethics"],
            related_roles=["ml_engineer", "data_engineer", "ai_researcher"],
            career_path_from=["data_analyst", "research_analyst"],
            career_path_to=["senior_data_scientist", "ml_engineer", "ai_lead"],
            keywords=["data science", "machine learning", "analytics", "ai"],
            responsibilities=[
                "Build predictive models",
                "Analyze complex datasets",
                "Extract insights from data",
                "Present findings to stakeholders",
                "Collaborate with engineering teams"
            ]
        ))
        
        # Product Manager
        self.add_profile(RoleProfile(
            role_id="product_manager",
            title="Product Manager",
            category="Product",
            description="Define product strategy and guide development",
            required_skills=["product strategy", "roadmapping", "stakeholder management", "agile", "analytics"],
            preferred_skills=["sql", "data analysis", "ux design", "technical background", "jira"],
            required_certifications=[],
            preferred_certifications=["Certified Scrum Product Owner", "Product Management Cert"],
            required_education=["Bachelor's in Business, CS, or related field"],
            min_years_experience=3,
            avg_years_experience=5,
            typical_salary_range={"min": 90000, "max": 170000, "mid": 120000},
            growth_areas=["data-driven decisions", "ai/ml products", "platform strategy"],
            related_roles=["product_owner", "program_manager", "business_analyst"],
            career_path_from=["business_analyst", "software_engineer", "project_manager"],
            career_path_to=["senior_pm", "director_product", "cpo"],
            keywords=["product", "strategy", "roadmap", "stakeholder", "agile"],
            responsibilities=[
                "Define product vision",
                "Prioritize features",
                "Work with engineering teams",
                "Analyze user feedback",
                "Track product metrics"
            ]
        ))
        
        # Site Reliability Engineer
        self.add_profile(RoleProfile(
            role_id="site_reliability_engineer",
            title="Site Reliability Engineer (SRE)",
            category="Infrastructure",
            description="Ensure system reliability, performance, and scalability",
            required_skills=["linux", "kubernetes", "monitoring", "incident response", "automation", "scripting"],
            preferred_skills=["python", "go", "terraform", "prometheus", "grafana", "sli/slo"],
            required_certifications=[],
            preferred_certifications=["CKA", "AWS DevOps"],
            required_education=["Bachelor's in Computer Science or related field"],
            min_years_experience=3,
            avg_years_experience=5,
            typical_salary_range={"min": 100000, "max": 180000, "mid": 130000},
            growth_areas=["chaos engineering", "observability", "platform engineering"],
            related_roles=["devops_engineer", "platform_engineer", "systems_engineer"],
            career_path_from=["devops_engineer", "systems_administrator"],
            career_path_to=["senior_sre", "staff_engineer", "infrastructure_lead"],
            keywords=["sre", "reliability", "monitoring", "incident", "automation"],
            responsibilities=[
                "Maintain system reliability",
                "Build monitoring solutions",
                "Respond to incidents",
                "Automate operations",
                "Define SLIs and SLOs"
            ]
        ))
    
    def _load_custom_profiles(self, profiles_path: str):
        """Load custom profiles from JSON file"""
        try:
            path = Path(profiles_path)
            if not path.exists():
                logger.warning("custom_profiles_not_found", path=profiles_path)
                return
            
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for profile_dict in data:
                profile = RoleProfile(**profile_dict)
                self.add_profile(profile)
            
            logger.info("custom_profiles_loaded", count=len(data))
        except Exception as e:
            logger.error("failed_to_load_custom_profiles", error=str(e))
    
    def add_profile(self, profile: RoleProfile):
        """Add or update a role profile"""
        self.profiles[profile.role_id] = profile
        logger.debug("profile_added", role_id=profile.role_id, title=profile.title)
    
    def get_profile(self, role_id: str) -> Optional[RoleProfile]:
        """Get a role profile by ID"""
        return self.profiles.get(role_id)
    
    def get_all_profiles(self) -> List[RoleProfile]:
        """Get all role profiles"""
        return list(self.profiles.values())
    
    def get_profiles_by_category(self, category: str) -> List[RoleProfile]:
        """Get all profiles in a category"""
        return [p for p in self.profiles.values() if p.category == category]
    
    def search_profiles(self, query: str) -> List[RoleProfile]:
        """Search profiles by title, keywords, or description"""
        query_lower = query.lower()
        results = []
        
        for profile in self.profiles.values():
            if (query_lower in profile.title.lower() or
                query_lower in profile.description.lower() or
                any(query_lower in kw.lower() for kw in profile.keywords)):
                results.append(profile)
        
        return results
    
    def export_to_json(self, output_path: str):
        """Export all profiles to JSON file"""
        data = [p.to_dict() for p in self.profiles.values()]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        logger.info("profiles_exported", path=output_path, count=len(data))
    
    def get_categories(self) -> List[str]:
        """Get list of all unique categories"""
        return list(set(p.category for p in self.profiles.values()))
    
    def get_career_paths(self, current_role_id: str) -> Dict[str, List[str]]:
        """Get possible career paths from a role"""
        profile = self.get_profile(current_role_id)
        if not profile:
            return {'from': [], 'to': [], 'related': []}
        
        return {
            'from': profile.career_path_from,
            'to': profile.career_path_to,
            'related': profile.related_roles
        }
