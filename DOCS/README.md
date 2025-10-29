# 🦁 God Lion Seeker Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

**AI-Powered Job Search Automation & Intelligent Application System**

God Lion Seeker Optimizer is a comprehensive job search automation platform that leverages AI and machine learning to help job seekers find, analyze, and apply to relevant positions across multiple job boards including LinkedIn, Indeed, and more.

---

## 🌟 Features

### 🔍 **Intelligent Job Scraping**
- Multi-platform support (LinkedIn, Indeed, and more)
- Automated job discovery with customizable search criteria
- Smart duplicate detection and deduplication
- Rate limiting and anti-detection mechanisms
- Headless browser automation with Playwright

### 🤖 **AI-Powered Matching**
- NLP-based resume parsing and analysis
- Intelligent job-to-profile matching using spaCy and scikit-learn
- Skill extraction and gap analysis
- Career path recommendations
- Match score calculation with detailed explanations

### 📊 **Analytics & Insights**
- Real-time job market analytics
- Salary trend analysis
- Company insights and ratings
- Application tracking and statistics
- Interactive dashboards with visualizations

### 🔐 **User Management**
- Secure authentication with JWT tokens
- Role-based access control (Admin, User, Guest)
- User profiles and preferences
- Resume management
- Application history tracking

### 🔔 **Notifications & Automation**
- Email notifications for new job matches
- Daily job summary reports
- Automated job application workflows
- Custom alert rules
- SSE (Server-Sent Events) for real-time updates

### 🐳 **Production-Ready**
- Docker and Docker Compose support
- Redis caching for performance
- MySQL database with Alembic migrations
- Prometheus metrics and Grafana dashboards
- Comprehensive logging with structlog
- Health checks and monitoring

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- MySQL 8.0+
- Redis (optional, for caching)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:God-Lion/God-Lion-Seeker-Optimizer.git
   cd God-Lion-Seeker-Optimizer
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_md
   playwright install chromium
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   # Windows
   setup_database.bat
   
   # Or manually
   alembic upgrade head
   ```

6. **Start the application**
   ```bash
   # Windows - Start API
   start_api.bat
   
   # Or using Python directly
   python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Access the application**
   - API Documentation: http://localhost:8000/api/docs
   - Health Check: http://localhost:8000/api/health

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services (API, MySQL, Redis, Monitoring)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up (removes volumes)
docker-compose down -v
```

### Services Included

- **API**: FastAPI application (Port 8000)
- **PostgreSQL**: Database (Port 5432)
- **Redis**: Caching layer (Port 6379)
- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Monitoring dashboards (Port 3000)

---

## 📖 Usage

### Command Line Interface

```bash
# Run job scraping
python run_cli.py scrape --platform linkedin --keywords "python developer" --location "Remote"

# Analyze jobs
python run_cli.py analyze --user-id 1

# Match jobs to profile
python run_cli.py match --user-id 1 --min-score 70

# Generate reports
python run_cli.py report --user-id 1 --format pdf
```

### API Endpoints

#### Authentication
```bash
# Register new user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Job Search
```bash
# Search jobs
POST /api/scraping/search
{
  "platforms": ["linkedin", "indeed"],
  "keywords": "python developer",
  "location": "Remote",
  "max_results": 50
}

# Get job details
GET /api/jobs/{job_id}

# Get matched jobs
GET /api/jobs/matched?user_id=1&min_score=70
```

#### Profile Management
```bash
# Update profile
PUT /api/profiles/{user_id}
{
  "skills": ["Python", "FastAPI", "Docker"],
  "experience_years": 5,
  "desired_salary": 120000
}

# Upload resume
POST /api/profiles/{user_id}/resume
```

---

## 🛠️ Development

### Project Structure

```
God-Lion-Seeker-Optimizer/
├── src/
│   ├── api/              # FastAPI routes and endpoints
│   ├── auth/             # Authentication and authorization
│   ├── automation/       # Job application automation
│   ├── cli/              # Command-line interface
│   ├── config/           # Configuration and settings
│   ├── models/           # SQLAlchemy database models
│   ├── notifications/    # Email and notification services
│   ├── repositories/     # Data access layer
│   ├── scrapers/         # Job board scrapers
│   ├── services/         # Business logic
│   ├── tests/            # Test suites
│   └── utils/            # Utility functions
├── monitoring/           # Prometheus and Grafana configs
├── tests/                # Additional test files
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # Container definition
├── Makefile              # Development commands
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_scrapers.py -v

# Run integration tests
pytest tests/integration/ -v
```

### Code Quality

```bash
# Format code
black src/ tests/
isort src/ tests/

# Lint code
ruff check src/ tests/

# Type checking
mypy src/

# Run all checks
make check
```

### Using Makefile

```bash
# Show all available commands
make help

# Setup development environment
make setup

# Run tests with coverage
make test-coverage

# Format and lint code
make format
make lint

# Start Docker environment
make docker-up

# View Docker logs
make docker-logs
```

---

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=godlionseeker_db

# Authentication
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password
INDEED_EMAIL=your_email@example.com
INDEED_PASSWORD=your_password

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Notifications
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password

# Scraping Settings
SCRAPE_HEADLESS=true
SCRAPE_MAX_WORKERS=3
SCRAPE_TIMEOUT=40
```

See `.env.example` for complete configuration options.

---

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at http://localhost:9090

Available metrics:
- `job_scraping_duration_seconds` - Scraping performance
- `job_matching_score` - Match quality
- `api_request_duration_seconds` - API performance
- `database_query_duration_seconds` - Database performance

### Grafana Dashboards

Access Grafana at http://localhost:3000 (default credentials: admin/admin)

Pre-configured dashboards:
- Job Scraping Overview
- API Performance
- Database Metrics
- User Activity

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guide
- Write tests for new features
- Update documentation as needed
- Use type hints
- Run `make check` before committing

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Playwright](https://playwright.dev/) - Browser automation
- [spaCy](https://spacy.io/) - NLP library
- [SQLAlchemy](https://www.sqlalchemy.org/) - SQL toolkit
- [Redis](https://redis.io/) - In-memory data store
- [Prometheus](https://prometheus.io/) - Monitoring system
- [Grafana](https://grafana.com/) - Visualization platform

---

## 📧 Contact

**Project Repository**: [https://github.com/God-Lion/God-Lion-Seeker-Optimizer](https://github.com/God-Lion/God-Lion-Seeker-Optimizer)

---

## 🗺️ Roadmap

- [ ] Support for additional job boards (Glassdoor, Monster, etc.)
- [ ] Mobile application (React Native)
- [ ] Chrome extension for one-click applications
- [ ] AI-powered cover letter generation
- [ ] Interview preparation recommendations
- [ ] Salary negotiation insights
- [ ] Network analysis and referral tracking
- [ ] Multi-language support

---

## ⚠️ Disclaimer

This tool is for educational and personal use only. Please respect the terms of service of job boards and websites when using this tool. The authors are not responsible for any misuse or violations of third-party terms of service.

---

**Made with ❤️ by God Lion**
