"""
CLI tool for career recommendation analysis.
Analyze resumes and get career recommendations from the command line.
"""
import click
import sys
from pathlib import Path
from typing import Optional
import structlog

from src.services.career_recommendation_service import CareerRecommendationService
from src.services.role_profiles import RoleProfileDatabase

logger = structlog.get_logger(__name__)


@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def cli(verbose: bool):
    """Career Recommendation CLI - Analyze resumes and find best-fit roles"""
    if verbose:
        import logging
        logging.basicConfig(level=logging.DEBUG)


@cli.command()
@click.argument('resume_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), help='Output file path for report')
@click.option('--format', '-f', type=click.Choice(['markdown', 'json', 'txt']), default='markdown',
              help='Output format for report')
@click.option('--top-n', '-n', type=int, default=10, help='Number of top roles to show')
@click.option('--embeddings/--no-embeddings', default=False, 
              help='Use semantic embeddings for matching (requires sentence-transformers)')
def analyze(resume_file: str, output: Optional[str], format: str, top_n: int, embeddings: bool):
    """
    Analyze a resume file and get career recommendations.
    
    Example:
        career-cli analyze my_resume.pdf
        career-cli analyze resume.docx --output report.md --format markdown
        career-cli analyze resume.txt --embeddings --top-n 5
    """
    click.echo(f"🔍 Analyzing resume: {resume_file}")
    
    try:
        # Initialize service
        service = CareerRecommendationService(use_embeddings=embeddings)
        
        # Analyze resume
        with click.progressbar(length=100, label='Processing') as bar:
            bar.update(30)
            recommendations = service.analyze_resume_file(resume_file)
            bar.update(70)
        
        # Display results
        click.echo("\n" + "=" * 70)
        click.echo("📊 CAREER RECOMMENDATION REPORT")
        click.echo("=" * 70 + "\n")
        
        # Resume summary
        click.echo("📋 Resume Summary:")
        click.echo(f"  • Skills Found: {len(recommendations.resume_data.skills)}")
        click.echo(f"  • Years of Experience: {recommendations.resume_data.years_experience}")
        click.echo(f"  • Education Entries: {len(recommendations.resume_data.education)}")
        click.echo(f"  • Certifications: {len(recommendations.resume_data.certifications or [])}")
        
        if recommendations.resume_data.skills:
            click.echo(f"  • Top Skills: {', '.join(recommendations.resume_data.skills[:10])}")
        
        click.echo()
        
        # Overall insights
        if recommendations.overall_insights:
            insights = recommendations.overall_insights
            click.echo("💡 Overall Insights:")
            click.echo(f"  • Career Stage: {insights.get('career_stage', 'N/A')}")
            click.echo(f"  • Best Fit Category: {insights.get('top_category', 'N/A')}")
            click.echo(f"  • Strongest Area: {insights.get('strongest_area', 'N/A')} ({insights.get('strongest_score', 0):.1%})")
            click.echo(f"  • Area to Improve: {insights.get('area_to_improve', 'N/A')} ({insights.get('improvement_score', 0):.1%})")
            click.echo()
        
        # Top roles
        click.echo(f"🎯 Top {min(top_n, len(recommendations.top_roles))} Matching Roles:\n")
        
        for i, match in enumerate(recommendations.top_roles[:top_n], 1):
            click.echo(f"{i}. {click.style(match.role_profile.title, fg='green', bold=True)}")
            click.echo(f"   Category: {match.role_profile.category}")
            click.echo(f"   Overall Fit: {click.style(f'{match.overall_score:.1%}', fg='cyan', bold=True)}")
            click.echo(f"   Breakdown:")
            click.echo(f"     - Skills: {match.skills_score:.1%}")
            click.echo(f"     - Experience: {match.experience_score:.1%}")
            click.echo(f"     - Education: {match.education_score:.1%}")
            click.echo(f"     - Certifications: {match.certification_score:.1%}")
            
            if match.matched_skills:
                click.echo(f"   Matched Skills: {', '.join(match.matched_skills[:8])}")
            
            if match.skill_gaps:
                click.echo(f"   Skill Gaps: {click.style(', '.join(match.skill_gaps[:5]), fg='yellow')}")
            
            if match.recommendations:
                click.echo(f"   Recommendations:")
                for rec in match.recommendations[:3]:
                    click.echo(f"     • {rec}")
            
            click.echo()
        
        # Career pathways
        if recommendations.career_pathways:
            click.echo("🚀 Career Pathways:\n")
            for path_name, path_info in list(recommendations.career_pathways.items())[:3]:
                click.echo(f"  {click.style(path_name, fg='blue', bold=True)}")
                for info in path_info:
                    click.echo(f"    • {info}")
                click.echo()
        
        # Export to file if requested
        if output:
            service.export_report(recommendations, output, format=format)
            click.echo(f"✅ Report exported to: {click.style(output, fg='green')}")
        
        click.echo("=" * 70)
        click.echo("✨ Analysis complete!")
        
    except FileNotFoundError as e:
        click.echo(f"❌ Error: Resume file not found: {resume_file}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        logger.error("cli_analysis_failed", error=str(e))
        sys.exit(1)


@cli.command()
@click.option('--category', '-c', help='Filter by role category')
@click.option('--search', '-s', help='Search roles by keyword')
def list_roles(category: Optional[str], search: Optional[str]):
    """
    List all available role profiles in the system.
    
    Example:
        career-cli list-roles
        career-cli list-roles --category "Security"
        career-cli list-roles --search "engineer"
    """
    click.echo("📚 Available Role Profiles:\n")
    
    try:
        role_db = RoleProfileDatabase()
        
        # Get profiles
        if search:
            profiles = role_db.search_profiles(search)
        elif category:
            profiles = role_db.get_profiles_by_category(category)
        else:
            profiles = role_db.get_all_profiles()
        
        if not profiles:
            click.echo("No roles found matching criteria.")
            return
        
        # Group by category
        by_category = {}
        for profile in profiles:
            if profile.category not in by_category:
                by_category[profile.category] = []
            by_category[profile.category].append(profile)
        
        # Display
        for cat, cat_profiles in sorted(by_category.items()):
            click.echo(f"{click.style(cat, fg='cyan', bold=True)} ({len(cat_profiles)} roles)")
            for profile in cat_profiles:
                click.echo(f"  • {click.style(profile.title, fg='green')} (ID: {profile.role_id})")
                click.echo(f"    {profile.description[:80]}...")
                click.echo(f"    Min Experience: {profile.min_years_experience} years")
                click.echo(f"    Key Skills: {', '.join(profile.required_skills[:5])}")
            click.echo()
        
        click.echo(f"Total: {click.style(str(len(profiles)), fg='yellow', bold=True)} roles")
        
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('role_id')
def role_details(role_id: str):
    """
    Show detailed information about a specific role.
    
    Example:
        career-cli role-details software_engineer
        career-cli role-details it_auditor
    """
    try:
        role_db = RoleProfileDatabase()
        profile = role_db.get_profile(role_id)
        
        if not profile:
            click.echo(f"❌ Error: Role '{role_id}' not found", err=True)
            click.echo("\nUse 'career-cli list-roles' to see available roles.")
            sys.exit(1)
        
        click.echo("=" * 70)
        click.echo(f"{click.style(profile.title, fg='green', bold=True)}")
        click.echo(f"Category: {profile.category}")
        click.echo("=" * 70 + "\n")
        
        click.echo(f"📝 Description:\n  {profile.description}\n")
        
        click.echo("🔧 Required Skills:")
        for skill in profile.required_skills:
            click.echo(f"  • {skill}")
        click.echo()
        
        if profile.preferred_skills:
            click.echo("✨ Preferred Skills:")
            for skill in profile.preferred_skills[:10]:
                click.echo(f"  • {skill}")
            click.echo()
        
        if profile.required_certifications:
            click.echo("📜 Required Certifications:")
            for cert in profile.required_certifications:
                click.echo(f"  • {cert}")
            click.echo()
        
        if profile.preferred_certifications:
            click.echo("📜 Preferred Certifications:")
            for cert in profile.preferred_certifications:
                click.echo(f"  • {cert}")
            click.echo()
        
        click.echo(f"🎓 Education: {', '.join(profile.required_education) if profile.required_education else 'Not specified'}")
        click.echo(f"⏱️  Experience: {profile.min_years_experience}+ years (avg: {profile.avg_years_experience} years)")
        
        if profile.typical_salary_range:
            sr = profile.typical_salary_range
            click.echo(f"💰 Typical Salary: ${sr.get('min', 0):,} - ${sr.get('max', 0):,} (mid: ${sr.get('mid', 0):,})")
        
        if profile.growth_areas:
            click.echo(f"\n🌱 Growth Areas:")
            for area in profile.growth_areas:
                click.echo(f"  • {area}")
        
        if profile.career_path_from or profile.career_path_to:
            click.echo(f"\n🚀 Career Paths:")
            if profile.career_path_from:
                click.echo(f"  From: {', '.join(profile.career_path_from)}")
            if profile.career_path_to:
                click.echo(f"  To: {', '.join(profile.career_path_to)}")
        
        if profile.related_roles:
            click.echo(f"\n🔗 Related Roles: {', '.join(profile.related_roles[:5])}")
        
        click.echo()
        
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
def categories():
    """
    List all role categories in the system.
    
    Example:
        career-cli categories
    """
    try:
        role_db = RoleProfileDatabase()
        categories = role_db.get_categories()
        
        click.echo("📂 Available Role Categories:\n")
        
        for cat in sorted(categories):
            profiles = role_db.get_profiles_by_category(cat)
            click.echo(f"  • {click.style(cat, fg='cyan', bold=True)} ({len(profiles)} roles)")
        
        click.echo(f"\nTotal: {click.style(str(len(categories)), fg='yellow', bold=True)} categories")
        
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('resume_file', type=click.Path(exists=True))
@click.argument('role_id')
@click.option('--embeddings/--no-embeddings', default=False)
def match_role(resume_file: str, role_id: str, embeddings: bool):
    """
    Check how well a resume matches a specific role.
    
    Example:
        career-cli match-role my_resume.pdf software_engineer
        career-cli match-role resume.docx it_auditor --embeddings
    """
    click.echo(f"🎯 Matching resume against: {role_id}\n")
    
    try:
        # Get role profile
        role_db = RoleProfileDatabase()
        profile = role_db.get_profile(role_id)
        
        if not profile:
            click.echo(f"❌ Error: Role '{role_id}' not found", err=True)
            sys.exit(1)
        
        # Analyze resume
        service = CareerRecommendationService(use_embeddings=embeddings)
        recommendations = service.analyze_resume_file(resume_file)
        
        # Find the match for this role
        role_match = None
        for match in recommendations.top_roles:
            if match.role_profile.role_id == role_id:
                role_match = match
                break
        
        if not role_match:
            click.echo(f"⚠️  Warning: Role analysis not found in top matches")
            sys.exit(1)
        
        # Display detailed match information
        click.echo(f"{click.style(profile.title, fg='green', bold=True)}")
        click.echo(f"Category: {profile.category}\n")
        
        click.echo(f"Overall Match: {click.style(f'{role_match.overall_score:.1%}', fg='cyan', bold=True)}\n")
        
        click.echo("📊 Score Breakdown:")
        click.echo(f"  • Skills: {click.style(f'{role_match.skills_score:.1%}', fg='green' if role_match.skills_score > 0.7 else 'yellow')}")
        click.echo(f"  • Experience: {click.style(f'{role_match.experience_score:.1%}', fg='green' if role_match.experience_score > 0.7 else 'yellow')}")
        click.echo(f"  • Education: {click.style(f'{role_match.education_score:.1%}', fg='green' if role_match.education_score > 0.7 else 'yellow')}")
        click.echo(f"  • Certifications: {click.style(f'{role_match.certification_score:.1%}', fg='green' if role_match.certification_score > 0.7 else 'yellow')}")
        click.echo()
        
        if role_match.matched_skills:
            click.echo(f"✅ Matched Skills ({len(role_match.matched_skills)}):")
            for skill in role_match.matched_skills[:15]:
                click.echo(f"  • {skill}")
            click.echo()
        
        if role_match.missing_skills:
            click.echo(f"❌ Missing Required Skills ({len(role_match.missing_skills)}):")
            for skill in role_match.missing_skills:
                click.echo(f"  • {click.style(skill, fg='red')}")
            click.echo()
        
        if role_match.skill_gaps:
            click.echo(f"⚠️  Critical Skill Gaps:")
            for gap in role_match.skill_gaps[:5]:
                click.echo(f"  • {click.style(gap, fg='yellow')}")
            click.echo()
        
        if role_match.recommendations:
            click.echo(f"💡 Recommendations to improve your match:")
            for i, rec in enumerate(role_match.recommendations, 1):
                click.echo(f"  {i}. {rec}")
            click.echo()
        
        # Overall assessment
        if role_match.overall_score >= 0.8:
            click.echo(f"✨ {click.style('Excellent match!', fg='green', bold=True)} You are well-qualified for this role.")
        elif role_match.overall_score >= 0.6:
            click.echo(f"👍 {click.style('Good match!', fg='cyan', bold=True)} You meet most requirements.")
        elif role_match.overall_score >= 0.4:
            click.echo(f"⚠️  {click.style('Moderate match.', fg='yellow', bold=True)} Consider developing missing skills.")
        else:
            click.echo(f"⛔ {click.style('Low match.', fg='red', bold=True)} This role may require significant upskilling.")
        
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('output_path', type=click.Path())
def export_roles(output_path: str):
    """
    Export all role profiles to a JSON file.
    
    Example:
        career-cli export-roles roles.json
    """
    try:
        role_db = RoleProfileDatabase()
        role_db.export_to_json(output_path)
        
        click.echo(f"✅ Exported {len(role_db.get_all_profiles())} role profiles to: {click.style(output_path, fg='green')}")
        
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
def version():
    """Show version information"""
    click.echo("Career Recommendation CLI v1.0.0")
    click.echo("Python-based career path analysis and recommendation system")
    click.echo("\nComponents:")
    click.echo("  • Resume Parser (NLP-based)")
    click.echo("  • Role Matching Engine (Semantic & Keyword)")
    click.echo("  • Career Path Analyzer")
    click.echo("\nFor more info: https://github.com/your-repo")


if __name__ == '__main__':
    cli()
