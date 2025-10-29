"""HTML email templates for job notifications"""
from typing import List, Dict, Any, Optional
from datetime import datetime


class EmailTemplateGenerator:
    """Generate HTML email templates for various notifications"""
    
    @staticmethod
    def get_base_style() -> str:
        """Get base CSS styles for all emails"""
        return """
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #0077B5, #00A0DC);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                margin: -30px -30px 30px -30px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .job-card {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 20px;
                margin: 15px 0;
                background-color: #fafafa;
                transition: box-shadow 0.3s;
            }
            .job-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .job-title {
                color: #0077B5;
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 10px 0;
                text-decoration: none;
            }
            .company-name {
                color: #666;
                font-size: 16px;
                margin: 5px 0;
            }
            .job-details {
                color: #666;
                font-size: 14px;
                margin: 10px 0;
            }
            .match-score {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                margin-top: 10px;
            }
            .score-high {
                background-color: #4CAF50;
                color: white;
            }
            .score-medium {
                background-color: #FF9800;
                color: white;
            }
            .score-low {
                background-color: #9E9E9E;
                color: white;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background-color: #0077B5;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 10px;
                font-weight: bold;
            }
            .btn:hover {
                background-color: #005885;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .stat-card {
                background-color: #f0f8ff;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            .stat-number {
                font-size: 32px;
                font-weight: bold;
                color: #0077B5;
            }
            .stat-label {
                color: #666;
                font-size: 14px;
                margin-top: 5px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 5px;
            }
            .badge-new {
                background-color: #4CAF50;
                color: white;
            }
            .badge-urgent {
                background-color: #F44336;
                color: white;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            th {
                background-color: #0077B5;
                color: white;
                padding: 12px;
                text-align: left;
            }
            td {
                padding: 10px;
                border-bottom: 1px solid #e0e0e0;
            }
            tr:hover {
                background-color: #f5f5f5;
            }
            .error-box {
                background-color: #ffebee;
                border-left: 4px solid #f44336;
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
            }
        </style>
        """
    
    @classmethod
    def generate_new_jobs_notification(
        cls,
        jobs: List[Dict[str, Any]],
        profile_name: Optional[str] = None,
        include_match_scores: bool = True
    ) -> str:
        """Generate HTML for new jobs notification"""
        profile_text = f" for {profile_name}" if profile_name else ""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {cls.get_base_style()}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 New Job Opportunities Found{profile_text}</h1>
                </div>
                
                <p>Found <strong>{len(jobs)}</strong> new job(s) matching your criteria:</p>
                
                <div class="jobs-list">
        """
        
        for job in jobs:
            match_score_html = ""
            if include_match_scores and 'match_score' in job:
                score = job['match_score']
                score_class = "score-high" if score >= 75 else "score-medium" if score >= 50 else "score-low"
                match_score_html = f'<div class="match-score {score_class}">Match: {score}%</div>'
            
            badges = ""
            if job.get('is_new', False):
                badges += '<span class="badge badge-new">NEW</span>'
            if job.get('posted_hours_ago', 48) < 24:
                badges += '<span class="badge badge-urgent">URGENT</span>'
            
            html += f"""
                    <div class="job-card">
                        {badges}
                        <a href="{job.get('link', '#')}" class="job-title">{job.get('title', 'N/A')}</a>
                        <div class="company-name">🏢 {job.get('company', 'Unknown Company')}</div>
                        <div class="job-details">
                            📍 {job.get('location', 'N/A')} | 
                            📅 Posted: {job.get('date', 'N/A')}
                        </div>
                        {match_score_html}
                        <a href="{job.get('link', '#')}" class="btn">View Job Details →</a>
                    </div>
            """
        
        html += f"""
                </div>
                
                <div class="footer">
                    <p>This email was sent by God Lion Seeker Optimizer</p>
                    <p>Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @classmethod
    def generate_high_match_alert(
        cls,
        jobs: List[Dict[str, Any]],
        threshold: float = 75.0
    ) -> str:
        """Generate HTML for high-match job alert"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {cls.get_base_style()}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⭐ High-Match Job Alert!</h1>
                </div>
                
                <p>We found <strong>{len(jobs)}</strong> job(s) with a match score above {threshold}%!</p>
                <p style="background-color: #fffbea; padding: 15px; border-left: 4px solid #ff9800; border-radius: 4px;">
                    <strong>💡 Action Required:</strong> These jobs are highly relevant to your profile. 
                    Consider applying soon as they may receive many applications.
                </p>
                
                <div class="jobs-list">
        """
        
        for job in jobs:
            score = job.get('match_score', 0)
            score_class = "score-high"
            
            skills_matched = job.get('skills_matched', [])
            skills_html = ""
            if skills_matched:
                skills_html = f"""
                <div style="margin-top: 10px;">
                    <strong>Matched Skills:</strong> {', '.join(skills_matched[:5])}
                    {'...' if len(skills_matched) > 5 else ''}
                </div>
                """
            
            html += f"""
                    <div class="job-card">
                        <span class="badge badge-urgent">HIGH MATCH</span>
                        <a href="{job.get('link', '#')}" class="job-title">{job.get('title', 'N/A')}</a>
                        <div class="company-name">🏢 {job.get('company', 'Unknown Company')}</div>
                        <div class="job-details">
                            📍 {job.get('location', 'N/A')} | 
                            📅 Posted: {job.get('date', 'N/A')}
                        </div>
                        <div class="match-score {score_class}">Match: {score}%</div>
                        {skills_html}
                        <a href="{job.get('link', '#')}" class="btn">Apply Now →</a>
                    </div>
            """
        
        html += f"""
                </div>
                
                <div class="footer">
                    <p>This email was sent by God Lion Seeker Optimizer</p>
                    <p>Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @classmethod
    def generate_daily_summary(
        cls,
        summary_data: Dict[str, Any]
    ) -> str:
        """Generate HTML for daily summary report"""
        stats = summary_data.get('stats', {})
        top_jobs = summary_data.get('top_jobs', [])
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {cls.get_base_style()}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Daily Job Search Summary</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">{summary_data.get('date', datetime.now().strftime('%Y-%m-%d'))}</p>
                </div>
                
                <h2>Today's Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">{stats.get('jobs_found', 0)}</div>
                        <div class="stat-label">Jobs Found</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{stats.get('jobs_analyzed', 0)}</div>
                        <div class="stat-label">Jobs Analyzed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{stats.get('high_matches', 0)}</div>
                        <div class="stat-label">High Matches</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{stats.get('companies', 0)}</div>
                        <div class="stat-label">Companies</div>
                    </div>
                </div>
                
                <h2>Top Matching Jobs</h2>
        """
        
        if top_jobs:
            html += '<div class="jobs-list">'
            for job in top_jobs[:5]:
                score = job.get('match_score', 0)
                score_class = "score-high" if score >= 75 else "score-medium"
                
                html += f"""
                    <div class="job-card">
                        <a href="{job.get('link', '#')}" class="job-title">{job.get('title', 'N/A')}</a>
                        <div class="company-name">🏢 {job.get('company', 'Unknown Company')}</div>
                        <div class="job-details">
                            📍 {job.get('location', 'N/A')} | 
                            📅 {job.get('date', 'N/A')}
                        </div>
                        <div class="match-score {score_class}">Match: {score}%</div>
                        <a href="{job.get('link', '#')}" class="btn">View Details →</a>
                    </div>
                """
            html += '</div>'
        else:
            html += '<p>No jobs found today.</p>'
        
        html += f"""
                <div class="footer">
                    <p>This email was sent by God Lion Seeker Optimizer</p>
                    <p>Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @classmethod
    def generate_error_notification(
        cls,
        errors: List[Dict[str, Any]]
    ) -> str:
        """Generate HTML for error notification"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            {cls.get_base_style()}
        </head>
        <body>
            <div class="container">
                <div class="header" style="background: linear-gradient(135deg, #F44336, #E91E63);">
                    <h1>⚠️ Error Report</h1>
                </div>
                
                <p><strong>{len(errors)}</strong> error(s) occurred during job scraping:</p>
                
                <div>
        """
        
        for i, error in enumerate(errors, 1):
            html += f"""
                <div class="error-box">
                    <strong>Error {i}:</strong> {error.get('message', 'Unknown error')}<br>
                    <small>Time: {error.get('timestamp', 'N/A')}</small><br>
                    <small>Context: {error.get('context', 'N/A')}</small>
                </div>
            """
        
        html += f"""
                </div>
                
                <p style="margin-top: 20px;">Please check the logs for more details.</p>
                
                <div class="footer">
                    <p>This email was sent by God Lion Seeker Optimizer</p>
                    <p>Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def _format_change(value: float) -> str:
        """Format change value with color"""
        if value > 0:
            return f'<span style="color: #4CAF50;">+{value}%</span>'
        elif value < 0:
            return f'<span style="color: #F44336;">{value}%</span>'
        else:
            return '<span style="color: #666;">0%</span>'
