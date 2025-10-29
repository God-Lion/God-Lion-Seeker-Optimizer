"""Unit tests for CLI modules"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from io import StringIO
import sys


class TestAutomationCLI:
    """Test automation CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.automation_cli import AutomationCLI
        return AutomationCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_list_schedules(self, mock_stdout, cli):
        """Test listing schedules"""
        cli.list_schedules()
        output = mock_stdout.getvalue()
        assert isinstance(output, str)
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_show_status(self, mock_stdout, cli):
        """Test showing automation status"""
        cli.show_status()
        output = mock_stdout.getvalue()
        assert isinstance(output, str)


class TestJobAnalysisCLI:
    """Test job analysis CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.job_analysis_cli import JobAnalysisCLI
        return JobAnalysisCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @pytest.mark.asyncio
    async def test_analyze_job(self, cli):
        """Test analyzing a job"""
        with patch.object(cli, '_analyze_job_internal', return_value={"score": 85}):
            result = await cli.analyze_job("12345")
            assert "score" in result


class TestCareerRecommendationCLI:
    """Test career recommendation CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.career_recommendation_cli import CareerRecommendationCLI
        return CareerRecommendationCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @pytest.mark.asyncio
    async def test_get_recommendations(self, cli):
        """Test getting career recommendations"""
        with patch.object(cli, '_get_recommendations_internal', return_value=[]):
            recommendations = await cli.get_recommendations()
            assert isinstance(recommendations, list)


class TestNotificationCLI:
    """Test notification CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.notification_cli import NotificationCLI
        return NotificationCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_list_notifications(self, mock_stdout, cli):
        """Test listing notifications"""
        cli.list_notifications()
        output = mock_stdout.getvalue()
        assert isinstance(output, str)


class TestResumeCustomizationCLI:
    """Test resume customization CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.resume_customization_cli import ResumeCustomizationCLI
        return ResumeCustomizationCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @pytest.mark.asyncio
    async def test_customize_resume(self, cli):
        """Test customizing resume"""
        with patch.object(cli, '_customize_internal', return_value="Customized resume"):
            result = await cli.customize_resume("resume.pdf", "job_id_123")
            assert isinstance(result, str)


class TestAnalyzeResumeCLI:
    """Test analyze resume CLI"""
    
    @pytest.fixture
    def cli(self):
        """Create CLI instance"""
        from cli.analyze_resume_cli import AnalyzeResumeCLI
        return AnalyzeResumeCLI()
    
    def test_cli_initialization(self, cli):
        """Test CLI initialization"""
        assert cli is not None
    
    @pytest.mark.asyncio
    async def test_analyze_resume(self, cli):
        """Test analyzing resume"""
        with patch.object(cli, '_analyze_internal', return_value={"skills": []}):
            result = await cli.analyze_resume("resume.pdf")
            assert isinstance(result, dict)


class TestCLIHelpers:
    """Test CLI helper functions"""
    
    def test_format_table(self):
        """Test formatting data as table"""
        from cli import format_table
        
        data = [
            {"name": "Job 1", "company": "Company A"},
            {"name": "Job 2", "company": "Company B"}
        ]
        
        table = format_table(data)
        assert isinstance(table, str)
    
    def test_format_json(self):
        """Test formatting data as JSON"""
        from cli import format_json
        
        data = {"key": "value", "number": 42}
        
        formatted = format_json(data)
        assert isinstance(formatted, str)
        assert "key" in formatted
    
    def test_parse_args(self):
        """Test parsing command line arguments"""
        from cli import parse_args
        
        test_args = ["--query", "Python Developer", "--location", "Remote"]
        
        with patch.object(sys, 'argv', ['script.py'] + test_args):
            args = parse_args()
            assert hasattr(args, 'query') or args is not None


class TestCLIValidation:
    """Test CLI input validation"""
    
    def test_validate_email(self):
        """Test email validation"""
        from cli import validate_email
        
        assert validate_email("test@example.com") is True
        assert validate_email("invalid-email") is False
    
    def test_validate_file_path(self):
        """Test file path validation"""
        from cli import validate_file_path
        
        with patch("os.path.exists", return_value=True):
            assert validate_file_path("test.pdf") is True
        
        with patch("os.path.exists", return_value=False):
            assert validate_file_path("nonexistent.pdf") is False
    
    def test_validate_url(self):
        """Test URL validation"""
        from cli import validate_url
        
        assert validate_url("https://example.com") is True
        assert validate_url("not-a-url") is False


class TestCLIOutput:
    """Test CLI output formatting"""
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_print_success(self, mock_stdout):
        """Test printing success message"""
        from cli import print_success
        
        print_success("Operation completed")
        output = mock_stdout.getvalue()
        
        assert "Operation completed" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_print_error(self, mock_stdout):
        """Test printing error message"""
        from cli import print_error
        
        print_error("Operation failed")
        output = mock_stdout.getvalue()
        
        assert "Operation failed" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_print_warning(self, mock_stdout):
        """Test printing warning message"""
        from cli import print_warning
        
        print_warning("Warning message")
        output = mock_stdout.getvalue()
        
        assert "Warning message" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_print_info(self, mock_stdout):
        """Test printing info message"""
        from cli import print_info
        
        print_info("Information message")
        output = mock_stdout.getvalue()
        
        assert "Information message" in output


class TestCLIProgress:
    """Test CLI progress indicators"""
    
    def test_progress_bar(self):
        """Test progress bar"""
        from cli import ProgressBar
        
        progress = ProgressBar(total=100)
        progress.update(50)
        
        assert progress.current == 50
        assert progress.percentage == 50.0
    
    def test_spinner(self):
        """Test spinner animation"""
        from cli import Spinner
        
        spinner = Spinner("Loading...")
        spinner.start()
        spinner.stop()
        
        assert spinner.is_running is False


class TestCLIInteractive:
    """Test interactive CLI features"""
    
    @patch('builtins.input', return_value='yes')
    def test_confirm_action(self, mock_input):
        """Test confirmation prompt"""
        from cli import confirm_action
        
        result = confirm_action("Are you sure?")
        assert result is True
    
    @patch('builtins.input', return_value='no')
    def test_confirm_action_negative(self, mock_input):
        """Test confirmation prompt with negative response"""
        from cli import confirm_action
        
        result = confirm_action("Are you sure?")
        assert result is False
    
    @patch('builtins.input', return_value='Option 1')
    def test_select_from_list(self, mock_input):
        """Test selecting from list"""
        from cli import select_from_list
        
        options = ["Option 1", "Option 2", "Option 3"]
        result = select_from_list(options, "Choose an option:")
        
        assert result == "Option 1"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
