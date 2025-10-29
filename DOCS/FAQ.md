# ❓ Frequently Asked Questions (FAQ)

Common questions and answers about God Lion Seeker Optimizer.

---

## General Questions

### What is God Lion Seeker Optimizer?

God Lion Seeker Optimizer is an AI-powered job search automation platform that helps job seekers find, analyze, and apply to relevant positions across multiple job boards. It uses machine learning and NLP to match jobs with your profile and automate the application process.

### Is it free to use?

Yes, the software is open-source and free to use under the MIT License. However, you'll need to provide your own infrastructure (server, database) to run it.

### Which job boards are supported?

Currently supported:
- LinkedIn
- Indeed

Planned support:
- Glassdoor
- Monster
- ZipRecruiter
- CareerBuilder

### Is this legal?

The tool is designed for personal use to help with job searching. However, you must:
- Respect the terms of service of each job board
- Use rate limiting to avoid overloading servers
- Not use it for commercial scraping
- Comply with local laws and regulations

We recommend reviewing each platform's terms of service before use.

---

## Installation & Setup

### What are the system requirements?

**Minimum:**
- Python 3.11+
- 2GB RAM
- 10GB storage
- MySQL 8.0+

**Recommended:**
- Python 3.11+
- 4GB+ RAM
- 20GB+ storage
- MySQL 8.0+
- Redis 6.0+

### Do I need Docker?

No, Docker is optional but recommended. You can run the application directly with Python, but Docker makes deployment easier and more consistent.

### Can I run this on Windows?

Yes! The application works on:
- Windows 10/11
- Linux (Ubuntu, Debian, CentOS, etc.)
- macOS

Batch scripts (`.bat`) are provided for Windows users.

### How do I get LinkedIn/Indeed credentials?

You need to provide your own login credentials for these platforms. Create accounts on:
- LinkedIn: https://www.linkedin.com
- Indeed: https://www.indeed.com

**Important:** Use app-specific passwords or 2FA-compatible methods where possible.

### What if I don't have LinkedIn/Indeed accounts?

The system can still work with guest/anonymous access for some features, but you'll get better results with authenticated access. Some features require authentication:
- Applying to jobs
- Saving jobs
- Accessing detailed job information

---

## Usage Questions

### How does job matching work?

The system uses:
1. **NLP (spaCy)** to analyze job descriptions and your resume
2. **Skill extraction** to identify required and preferred skills
3. **Machine learning** (scikit-learn) to calculate match scores
4. **Weighted scoring** based on:
   - Skill matches
   - Experience level
   - Location preferences
   - Salary expectations
   - Job type preferences

### What is a "match score"?

A match score (0-100) indicates how well a job matches your profile:
- **90-100**: Excellent match
- **80-89**: Very good match
- **70-79**: Good match
- **60-69**: Fair match
- **Below 60**: Poor match

### Can I customize the matching algorithm?

Yes! You can adjust:
- Skill weights
- Experience level importance
- Location preferences
- Salary ranges
- Job type preferences

Edit your profile settings through the API or database.

### How often should I run job searches?

Recommended frequency:
- **Daily**: For active job seekers
- **2-3 times per week**: For passive job seekers
- **Weekly**: For market research

**Note:** Respect rate limits to avoid IP bans.

### Can I automate job applications?

Yes, the system supports automated applications with:
- Custom cover letters
- Resume attachments
- Application tracking
- Status monitoring

**Caution:** Review applications before submission to ensure quality.

---

## Technical Questions

### How do I update the application?

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt --upgrade

# Run database migrations
alembic upgrade head

# Restart the application
docker-compose restart  # If using Docker
# or
systemctl restart godlionseeker  # If using systemd
```

### How do I backup my data?

**Database backup:**
```bash
mysqldump -u root -p godlionseeker_db > backup.sql
```

**Application data:**
```bash
tar -czf backup.tar.gz /app/data /app/logs /app/.env
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for automated backup scripts.

### How do I migrate to a new server?

1. **Backup data** on old server
2. **Install application** on new server
3. **Restore database** backup
4. **Copy application data** and `.env` file
5. **Update configuration** (if needed)
6. **Test** the application
7. **Update DNS** (if applicable)

### Can I use PostgreSQL instead of MySQL?

Yes! The application uses SQLAlchemy, which supports multiple databases. Update your `.env`:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
```

### How do I scale the application?

**Horizontal scaling:**
- Use load balancer (Nginx, HAProxy)
- Run multiple API instances
- Use Redis for session sharing
- Separate database server

**Vertical scaling:**
- Increase CPU/RAM
- Optimize database queries
- Enable caching
- Use connection pooling

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

---

## Troubleshooting

### The scraper is not finding jobs

**Possible causes:**
1. **Incorrect credentials** - Verify in `.env`
2. **Rate limiting** - Wait and try again
3. **Platform changes** - Check for updates
4. **Network issues** - Check internet connection
5. **Search criteria too specific** - Broaden your search

**Solutions:**
- Check logs: `docker-compose logs api`
- Verify credentials
- Update to latest version
- Adjust search parameters

### I'm getting "Database connection failed"

**Solutions:**
1. Verify MySQL is running: `systemctl status mysql`
2. Check credentials in `.env`
3. Test connection: `mysql -u root -p`
4. Ensure database exists: `CREATE DATABASE godlionseeker_db;`
5. Check firewall rules

### Jobs are not matching my profile

**Solutions:**
1. **Update your profile** with accurate skills
2. **Upload your resume** for better skill extraction
3. **Adjust match thresholds** in settings
4. **Review job descriptions** to understand requirements
5. **Update skill weights** to prioritize important skills

### The API is slow

**Optimization steps:**
1. **Enable Redis caching**
2. **Optimize database queries** (add indexes)
3. **Increase worker count**
4. **Scale horizontally**
5. **Use CDN** for static assets
6. **Enable gzip compression**

### I'm getting rate limited

**Solutions:**
1. **Increase delays** between requests
2. **Reduce concurrent workers**
3. **Use rotating proxies** (advanced)
4. **Respect platform rate limits**
5. **Space out scraping sessions**

### Playwright browser crashes

**Solutions:**
1. **Install dependencies**: `playwright install-deps chromium`
2. **Increase memory**: Allocate more RAM
3. **Use headless mode**: Set `SCRAPE_HEADLESS=true`
4. **Update Playwright**: `pip install playwright --upgrade`
5. **Check logs** for specific errors

---

## Security Questions

### Is my data secure?

Security measures:
- ✅ Passwords hashed with bcrypt
- ✅ JWT token authentication
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ HTTPS support
- ✅ Environment variable configuration
- ✅ No credentials in code

See [SECURITY.md](SECURITY.md) for details.

### Should I use 2FA?

Yes! Enable 2FA on:
- Your job board accounts
- Database access
- Server access
- GitHub account

### How do I report a security vulnerability?

**Do not** create a public issue. Instead:
1. Go to the Security tab on GitHub
2. Click "Report a vulnerability"
3. Provide detailed information

See [SECURITY.md](SECURITY.md) for the full process.

### Can I use this in production?

Yes, but ensure you:
- ✅ Use strong passwords
- ✅ Enable HTTPS
- ✅ Configure firewall
- ✅ Set up monitoring
- ✅ Regular backups
- ✅ Keep software updated
- ✅ Follow security best practices

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

---

## Feature Requests

### Can you add support for [Job Board X]?

We welcome contributions! To add a new job board:
1. Check if there's an existing issue
2. Create a feature request
3. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Will there be a mobile app?

A mobile app is on the roadmap! Planned features:
- React Native app
- Push notifications
- Quick apply
- Job alerts
- Profile management

### Can I get email notifications?

Yes! Email notifications are supported:
- New job matches
- Application status updates
- Daily summaries
- High-match alerts

Configure in `.env`:
```bash
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SENDER_EMAIL=your-email@gmail.com
```

### Is there a Chrome extension?

Not yet, but it's planned! The extension will allow:
- One-click job applications
- Quick save jobs
- Job analysis
- Profile matching

---

## Contributing

### How can I contribute?

Ways to contribute:
1. **Code**: Submit pull requests
2. **Documentation**: Improve docs
3. **Bug reports**: Report issues
4. **Feature requests**: Suggest improvements
5. **Testing**: Test new features
6. **Translations**: Add language support

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### I found a bug, what should I do?

1. **Search existing issues** to avoid duplicates
2. **Create a bug report** using the template
3. **Provide details**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details
   - Logs/screenshots

### How do I submit a pull request?

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make changes** and commit
4. **Write tests** for new features
5. **Run tests**: `pytest`
6. **Submit PR** using the template

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full process.

---

## Performance

### How many jobs can the system handle?

The system can handle:
- **Thousands** of jobs in the database
- **Hundreds** of concurrent users
- **Dozens** of simultaneous scraping tasks

Performance depends on:
- Server resources
- Database optimization
- Caching configuration
- Network speed

### How fast is job matching?

Typical performance:
- **Single job match**: < 100ms
- **Batch matching (100 jobs)**: < 5 seconds
- **Full profile analysis**: < 10 seconds

With Redis caching, subsequent matches are even faster.

### Can I run multiple scrapers simultaneously?

Yes! Configure in `.env`:
```bash
SCRAPE_MAX_WORKERS=3  # Number of concurrent scrapers
```

**Caution:** More workers = higher resource usage and rate limit risk.

---

## Licensing

### Can I use this commercially?

Yes, under the MIT License you can:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute
- ✅ Sublicense

Requirements:
- Include the original license
- Include copyright notice

### Can I sell this software?

Yes, but:
- You must include the MIT License
- You must credit the original authors
- You cannot hold authors liable

### Do I need to open-source my modifications?

No, the MIT License does not require you to open-source modifications. However, we encourage contributing back to the community!

---

## Support

### Where can I get help?

1. **Documentation**: Read [README.md](README.md)
2. **FAQ**: Check this document
3. **Issues**: Search existing issues
4. **Discussions**: Use GitHub Discussions
5. **Community**: Join the community

### How do I report a bug?

Use the bug report template:
https://github.com/God-Lion/God-Lion-Seeker-Optimizer/issues/new?template=bug_report.md

### Is there commercial support?

Currently, support is community-based. For commercial support inquiries, contact the maintainers.

---

## Miscellaneous

### What technologies are used?

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy
- Playwright
- spaCy
- scikit-learn

**Database:**
- MySQL 8.0+
- Redis (optional)

**Monitoring:**
- Prometheus
- Grafana

**Deployment:**
- Docker
- Docker Compose

### How is this different from other job scrapers?

**Unique features:**
- ✅ AI-powered matching
- ✅ Multi-platform support
- ✅ Automated applications
- ✅ Real-time analytics
- ✅ REST API
- ✅ Production-ready
- ✅ Open source

### Can I integrate this with other tools?

Yes! The REST API allows integration with:
- Custom frontends
- Mobile apps
- Browser extensions
- Other automation tools
- Analytics platforms

### What's the project roadmap?

See [README.md](README.md#roadmap) for the full roadmap. Highlights:
- Additional job boards
- Mobile app
- Chrome extension
- AI cover letter generation
- Interview preparation
- Multi-language support

---

## Still Have Questions?

If your question isn't answered here:

1. **Search** existing issues and discussions
2. **Create** a new issue with the "question" label
3. **Join** the community discussions
4. **Read** the full documentation

---

**Last Updated**: October 25, 2024  
**Version**: 1.0.0

For more information, see:
- [README.md](README.md)
- [QUICKSTART.md](QUICKSTART.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
