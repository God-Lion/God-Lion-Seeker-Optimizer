# 🚀 Quick Start Guide

Get God Lion Seeker Optimizer up and running in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ Python 3.11 or higher
- ✅ MySQL 8.0+ installed and running
- ✅ Git installed
- ✅ 4GB+ RAM available
- ✅ Internet connection

## 5-Minute Setup

### Step 1: Clone the Repository

```bash
git clone git@github.com:God-Lion/God-Lion-Seeker-Optimizer.git
cd God-Lion-Seeker-Optimizer
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_md
playwright install chromium
```

### Step 4: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (use notepad, vim, or any text editor)
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Minimum required settings in `.env`:**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=godlionseeker_db

# Optional but recommended
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password
```

### Step 5: Setup Database

**Windows:**
```bash
setup_database.bat
```

**Linux/Mac:**
```bash
# Create database manually
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS godlionseeker_db;"

# Run migrations
alembic upgrade head
```

### Step 6: Start the Application

**Windows:**
```bash
start_api.bat
```

**Linux/Mac:**
```bash
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 7: Access the Application

Open your browser and navigate to:

- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health
- **Alternative Docs**: http://localhost:8000/api/redoc

## 🎯 First Steps

### 1. Create Your First User

Using the API documentation at http://localhost:8000/api/docs:

1. Navigate to **POST /api/auth/register**
2. Click "Try it out"
3. Enter your details:
```json
{
  "email": "your_email@example.com",
  "password": "SecurePassword123!",
  "full_name": "Your Name"
}
```
4. Click "Execute"

### 2. Login and Get Token

1. Navigate to **POST /api/auth/login**
2. Click "Try it out"
3. Enter your credentials:
```json
{
  "email": "your_email@example.com",
  "password": "SecurePassword123!"
}
```
4. Copy the `access_token` from the response

### 3. Authorize API Requests

1. Click the **Authorize** button at the top of the API docs
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click "Authorize"

### 4. Start Your First Job Search

1. Navigate to **POST /api/scraping/search**
2. Click "Try it out"
3. Enter search criteria:
```json
{
  "platforms": ["linkedin"],
  "keywords": "python developer",
  "location": "Remote",
  "max_results": 10
}
```
4. Click "Execute"

### 5. View Your Results

1. Navigate to **GET /api/jobs**
2. Click "Try it out"
3. Click "Execute" to see all jobs
4. Or use **GET /api/jobs/matched** to see jobs matched to your profile

## 🐳 Docker Quick Start (Alternative)

If you prefer Docker:

### Step 1: Clone Repository
```bash
git clone git@github.com:God-Lion/God-Lion-Seeker-Optimizer.git
cd God-Lion-Seeker-Optimizer
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env as needed
```

### Step 3: Start with Docker Compose
```bash
docker-compose up -d
```

### Step 4: Access Application
- **API**: http://localhost:8000/api/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### Step 5: View Logs
```bash
docker-compose logs -f api
```

## 📋 Common Tasks

### Run Job Scraping via CLI

```bash
python run_cli.py scrape --platform linkedin --keywords "python developer" --location "Remote"
```

### Analyze Jobs

```bash
python run_cli.py analyze --user-id 1
```

### Generate Report

```bash
python run_cli.py report --user-id 1 --format pdf
```

### View Database

```bash
# Windows
mysql -u root -p godlionseeker_db

# Linux/Mac
mysql -u root -p godlionseeker_db
```

## 🔧 Troubleshooting

### Issue: "Module not found" error

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Database connection failed

**Solution:**
1. Verify MySQL is running
2. Check credentials in `.env`
3. Ensure database exists:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS godlionseeker_db;"
```

### Issue: Playwright browser not found

**Solution:**
```bash
playwright install chromium
playwright install-deps chromium  # Linux only
```

### Issue: Port 8000 already in use

**Solution:**
```bash
# Find and kill the process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Issue: Permission denied on scripts

**Solution:**
```bash
# Linux/Mac
chmod +x *.sh
```

## 🎓 Next Steps

Now that you're up and running:

1. **Configure Your Profile**
   - Upload your resume
   - Add your skills
   - Set job preferences

2. **Explore the API**
   - Try different endpoints
   - Experiment with filters
   - Test automation features

3. **Set Up Notifications**
   - Configure email settings
   - Create alert rules
   - Enable daily summaries

4. **Customize Scraping**
   - Add more platforms
   - Adjust search criteria
   - Configure rate limits

5. **Monitor Performance**
   - Check Prometheus metrics
   - View Grafana dashboards
   - Review application logs

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **API Reference**: http://localhost:8000/api/docs
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security Policy**: [SECURITY.md](SECURITY.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

## 💡 Tips

- **Use the Makefile**: Run `make help` to see all available commands
- **Enable Debug Mode**: Set `DEBUG=true` in `.env` for verbose logging
- **Backup Your Data**: Regularly backup your database
- **Update Regularly**: Pull latest changes with `git pull`
- **Join the Community**: Star the repo and watch for updates

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [existing issues](https://github.com/God-Lion/God-Lion-Seeker-Optimizer/issues)
3. Create a [new issue](https://github.com/God-Lion/God-Lion-Seeker-Optimizer/issues/new)
4. Review the [full documentation](README.md)

## 🎉 Success!

You're now ready to use God Lion Seeker Optimizer! Happy job hunting! 🦁

---

**Need more detailed instructions?** Check out the [full README](README.md) for comprehensive documentation.
