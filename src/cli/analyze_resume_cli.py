"""
Command-line interface for candidate profile analysis.
"""
import argparse
import sys
from pathlib import Path
import json
from typing import Optional
import structlog

from src.services.resume_parser import ResumeParser
from src.services.role_profiles import RoleProfileDatabase
from src.services.candidate_analyzer_service import CandidateProfileAnalyzer
from src.services.report_generator_service import ReportGenerator

logger = structlog.get_logger(__name__)


class AnalyzerCLI:
    """Command-line interface for resume analysis"""
    
    def __init__(self):
        self.parser = argparse.ArgumentParser(
            description='Analyze resumes and match to job roles',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  # Analyze a resume
  python analyze_resume_cli.py --file resume.pdf
  
  # Analyze with custom top matches
  python analyze_resume_cli.py --file resume.pdf --top 10
  
  # Export report to JSON
  python analyze_resume_cli.py --file resume.pdf --format json --output report.json
  
  # Compare specific roles
  python analyze_resume_cli.py --file resume.pdf --compare it_auditor,security_analyst
  
  # Use custom role profiles
  python analyze_resume_cli.py --file resume.pdf --roles custom_roles.json
            """
        )
        self._setup_arguments()
    
    def _setup_arguments(self):
        """Setup command-line arguments"""
        # Required arguments
        self.parser.add_argument(
            '--file', '-f',
            required=True,
            help='Path to resume file (PDF, DOCX, or TXT)'
        )
        
        # Optional arguments
        self.parser.add_argument(
            '--top', '-t',
            type=int,
            default=5,
            help='Number of top matches to show (default: 5)'
        )
        
        self.parser.add_argument(
            '--min-score',
            type=float,
            default=0.5,
            help='Minimum fit score threshold (default: 0.5)'
        )
        
        self.parser.add_argument(
            '--format',
            choices=['text', 'json', 'html', 'markdown'],
            default='text',
            help='Output format (default: text)'
        )
        
        self.parser.add_argument(
            '--output', '-o',
            help='Output file path (default: stdout)'
        )
        
        self.parser.add_argument(
            '--roles',
            help='Path to custom role profiles JSON file'
        )
        
        self.parser.add_argument(
            '--compare',
            help='Compare specific roles (comma-separated role IDs)'
        )
        
        self.parser.add_argument(
            '--weights',
            help='Custom weights as JSON string (e.g., \'{"education":0.2,"skills":0.4}\')'
        )
        
        self.parser.add_argument(
            '--verbose', '-v',
            action='store_true',
            help='Enable verbose output'
        )
        
        self.parser.add_argument(
            '--list-roles',
            action='store_true',
            help='List all available roles and exit'
        )
    
    def run(self, args=None):
        """Run the CLI"""
        parsed_args = self.parser.parse_args(args)
        
        try:
            # Initialize components
            resume_parser = ResumeParser()
            role_database = RoleProfileDatabase(parsed_args.roles)
            
            # Handle list roles
            if parsed_args.list_roles:
                self._list_roles(role_database)
                return 0
            
            # Validate resume file
            resume_path = Path(parsed_args.file)
            if not resume_path.exists():
                print(f"Error: Resume file not found: {parsed_args.file}", file=sys.stderr)
                return 1
            
            # Parse custom weights if provided
            weights = None
            if parsed_args.weights:
                try:
                    weights = json.loads(parsed_args.weights)
                except json.JSONDecodeError as e:
                    print(f"Error: Invalid weights JSON: {e}", file=sys.stderr)
                    return 1
            
            # Initialize analyzer
            analyzer = CandidateProfileAnalyzer(
                resume_parser=resume_parser,
                role_database=role_database,
                weights=weights
            )
            
            # Perform analysis
            if parsed_args.compare:
                # Compare specific roles
                role_ids = [r.strip() for r in parsed_args.compare.split(',')]
                matches = analyzer.compare_roles(str(resume_path), role_ids)
                report = self._create_comparison_report(matches)
            else:
                # Full analysis
                report = analyzer.analyze_resume(
                    str(resume_path),
                    top_n=parsed_args.top,
                    min_score=parsed_args.min_score
                )
            
            # Generate output
            report_gen = ReportGenerator()
            output = self._generate_output(
                report,
                parsed_args.format,
                report_gen
            )
            
            # Write output
            if parsed_args.output:
                output_path = Path(parsed_args.output)
                output_path.write_text(output, encoding='utf-8')
                print(f"Report saved to: {parsed_args.output}")
            else:
                print(output)
            
            return 0
            
        except Exception as e:
            logger.exception("cli_error")
            print(f"Error: {str(e)}", file=sys.stderr)
            if parsed_args.verbose:
                import traceback
                traceback.print_exc()
            return 1
    
    def _list_roles(self, role_database: RoleProfileDatabase):
        """List all available roles"""
        print("\n=== Available Roles ===\n")
        
        categories = role_database.get_categories()
        for category in sorted(categories):
            print(f"\n{category}:")
            profiles = role_database.get_profiles_by_category(category)
            for profile in sorted(profiles, key=lambda p: p.title):
                print(f"  {profile.role_id:30s} - {profile.title}")
        
        print(f"\nTotal roles: {len(role_database.get_all_profiles())}")
    
    def _create_comparison_report(self, matches):
        """Create a simple comparison report from matches"""
        from services.candidate_analyzer_service import AnalysisReport
        
        # Extract basic info from first match if available
        if matches:
            first_match = matches[0]
            return AnalysisReport(
                candidate_name=None,
                top_matches=matches,
                current_skills=[],
                years_experience=0,
                education=[],
                certifications=[],
                recommendations={'summary': 'Role comparison', 'actions': []},
                skill_development_plan=[]
            )
        
        return None
    
    def _generate_output(self, report, format_type: str, report_gen: ReportGenerator) -> str:
        """Generate output in specified format"""
        if format_type == 'json':
            return report_gen.to_json(report)
        elif format_type == 'html':
            return report_gen.to_html(report)
        elif format_type == 'markdown':
            return report_gen.to_markdown(report)
        else:  # text
            return report_gen.to_text(report)


def main():
    """Main entry point"""
    cli = AnalyzerCLI()
    sys.exit(cli.run())


if __name__ == '__main__':
    main()
