# Contributing to God Lion Seeker Optimizer

Thank you for your interest in contributing to God Lion Seeker Optimizer! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone git@github.com:YOUR_USERNAME/God-Lion-Seeker-Optimizer.git
   cd God-Lion-Seeker-Optimizer
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream git@github.com:God-Lion/God-Lion-Seeker-Optimizer.git
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Python 3.11 or higher
- MySQL 8.0+
- Redis (optional)
- Git

### Installation

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   make install-dev
   # Or manually:
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   python -m spacy download en_core_web_md
   playwright install chromium
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**:
   ```bash
   alembic upgrade head
   ```

5. **Install pre-commit hooks**:
   ```bash
   pre-commit install
   ```

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix issues reported in the issue tracker
- **Features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Refactoring**: Improve code quality without changing functionality

### Contribution Workflow

1. **Check existing issues** to avoid duplicate work
2. **Create an issue** if one doesn't exist for your contribution
3. **Discuss your approach** in the issue before starting work
4. **Write code** following our coding standards
5. **Add tests** for new functionality
6. **Update documentation** as needed
7. **Submit a pull request**

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with some modifications:

- **Line length**: 100 characters (not 79)
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Double quotes for strings
- **Imports**: Organized using isort

### Code Formatting

We use automated tools to maintain consistent code style:

```bash
# Format code
black src/ tests/
isort src/ tests/

# Or use make command
make format
```

### Type Hints

Use type hints for all function signatures:

```python
from typing import Optional, List, Dict

def get_jobs(
    user_id: int,
    keywords: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get jobs for a user."""
    pass
```

### Docstrings

Use Google-style docstrings:

```python
def scrape_jobs(platform: str, keywords: str) -> List[Job]:
    """
    Scrape jobs from a specific platform.
    
    Args:
        platform: The job board platform (e.g., 'linkedin', 'indeed')
        keywords: Search keywords for job search
        
    Returns:
        List of Job objects containing scraped job data
        
    Raises:
        ScraperError: If scraping fails
        
    Example:
        >>> jobs = scrape_jobs('linkedin', 'python developer')
        >>> len(jobs)
        50
    """
    pass
```

### Naming Conventions

- **Variables/Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: `_leading_underscore`

### Code Organization

```python
# 1. Standard library imports
import os
import sys
from typing import Optional

# 2. Third-party imports
from fastapi import FastAPI
from sqlalchemy import select

# 3. Local imports
from models.job import Job
from services.scraper import ScraperService
```

## Testing Guidelines

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```python
def test_job_matching_calculates_correct_score():
    """Test that job matching calculates the correct match score."""
    # Arrange
    user_profile = create_test_profile()
    job = create_test_job()
    
    # Act
    score = calculate_match_score(user_profile, job)
    
    # Assert
    assert 0 <= score <= 100
    assert score > 50  # Should be a good match
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_scrapers.py -v

# Run tests matching pattern
pytest -k "test_job_matching"

# Or use make commands
make test
make test-coverage
```

### Test Types

- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete workflows

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all quality checks**:
   ```bash
   make check
   # This runs: lint, type-check, test-coverage, security-check
   ```

3. **Update documentation** if needed

4. **Add entry to CHANGELOG** (if applicable)

### PR Guidelines

- **Title**: Clear and descriptive (e.g., "Add LinkedIn scraper rate limiting")
- **Description**: Explain what, why, and how
- **Link issues**: Reference related issues (e.g., "Fixes #123")
- **Screenshots**: Include for UI changes
- **Breaking changes**: Clearly document any breaking changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Address feedback** and make requested changes
4. **Approval** from maintainer(s)
5. **Merge** by maintainer

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Python version, etc.
- **Screenshots**: If applicable
- **Logs**: Relevant error messages or logs

### Feature Requests

Use the feature request template and include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional context**: Any other relevant information

### Questions

For questions:
- Check existing documentation first
- Search existing issues
- Create a new issue with the "question" label

## Development Tips

### Useful Commands

```bash
# Show all available make commands
make help

# Setup development environment
make setup

# Run linter
make lint

# Format code
make format

# Type checking
make type-check

# Run tests with coverage
make test-coverage

# Start Docker environment
make docker-up

# View logs
make docker-logs

# Clean up
make clean
```

### Debugging

- Use `structlog` for logging
- Set `DEBUG=true` in `.env` for verbose output
- Use `pytest -s` to see print statements
- Use `breakpoint()` for debugging

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Getting Help

- **Documentation**: Check the [README](README.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to God Lion Seeker Optimizer! 🦁
