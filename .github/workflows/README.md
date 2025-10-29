# 🔄 CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## 📋 Available Workflows

### 1. Tests and Linting (`tests.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Job
- Runs code quality checks
- Uses Python 3.13
- Checks:
  - **Ruff**: Fast Python linter
  - **Black**: Code formatter verification
  - **MyPy**: Static type checking
- All checks continue on error (won't fail the build)

#### Test Job
- Runs test suite across multiple Python versions
- **Matrix Strategy**: Tests on Python 3.11, 3.12, and 3.13
- **Services**:
  - MySQL 8.0 (test database)
  - Redis 7 (caching)
- **Steps**:
  1. Install system dependencies for Playwright
  2. Install Python dependencies
  3. Install Playwright browsers (Chromium)
  4. Download spaCy language model
  5. Set up test environment variables
  6. Run unit tests with coverage
  7. Run integration tests with coverage
  8. Upload coverage to Codecov

#### Security Job
- Runs security scans
- **Tools**:
  - **Bandit**: Security linter for Python
  - **Safety**: Dependency vulnerability scanner
- Uploads security reports as artifacts

#### Build Job
- Builds Docker image
- Runs only after lint and test jobs pass
- Tests Docker image import

---

### 2. Deploy (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (`v*`)
- Release published

**Jobs:**

#### Deploy Job
- Builds and pushes Docker image to Docker Hub
- Creates GitHub releases for version tags
- Optional server deployment

**Steps:**
1. **Setup**: Checkout code and configure Docker Buildx
2. **Login**: Authenticate with Docker Hub
3. **Metadata**: Extract version tags and labels
4. **Build & Push**: Build multi-platform image and push to registry
5. **Release**: Create GitHub release with auto-generated notes (for tags)
6. **Deploy**: Optional deployment to server (placeholder)

**Docker Tags Generated:**
- `main` - Latest from main branch
- `v1.0.0` - Semantic version
- `v1.0` - Major.minor version
- `sha-abc123` - Git commit SHA

---

## 🔧 Setup Requirements

### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

#### For Docker Hub Deployment
```
DOCKER_USERNAME - Your Docker Hub username
DOCKER_PASSWORD - Your Docker Hub password or access token
```

#### For Codecov (Optional)
```
CODECOV_TOKEN - Your Codecov upload token
```

### Optional Secrets for Deployment

```
SSH_PRIVATE_KEY - SSH key for server deployment
SERVER_HOST - Deployment server hostname
SERVER_USER - SSH username
KUBECONFIG - Kubernetes configuration (for K8s deployment)
```

---

## 📊 Workflow Status Badges

Add these badges to your README.md:

```markdown
![Tests](https://github.com/God-Lion/God-Lion-Seeker-Optimizer/workflows/Tests%20and%20Linting/badge.svg)
![Deploy](https://github.com/God-Lion/God-Lion-Seeker-Optimizer/workflows/Deploy/badge.svg)
[![codecov](https://codecov.io/gh/God-Lion/God-Lion-Seeker-Optimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/God-Lion/God-Lion-Seeker-Optimizer)
```

---

## 🚀 Usage Examples

### Running Tests Locally

Before pushing, run tests locally:

```bash
# Run linting
ruff check src/ tests/
black --check src/ tests/
mypy src/

# Run tests
pytest tests/ -v --cov=src

# Run security checks
bandit -r src/
safety check
```

### Creating a Release

1. **Update version** in relevant files
2. **Update CHANGELOG.md** with release notes
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "chore: Bump version to 1.0.0"
   ```
4. **Create and push tag**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
5. **Workflow automatically**:
   - Builds Docker image
   - Pushes to Docker Hub
   - Creates GitHub release

### Manual Workflow Trigger

You can manually trigger workflows from the Actions tab:

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

---

## 🔍 Monitoring Workflows

### View Workflow Runs

1. Go to **Actions** tab in GitHub
2. Click on a workflow run to see details
3. View logs for each job and step

### Download Artifacts

Security reports and other artifacts are available:

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download reports

### Debugging Failed Workflows

If a workflow fails:

1. **Check the logs**: Click on the failed step
2. **Review error messages**: Look for specific errors
3. **Run locally**: Reproduce the issue on your machine
4. **Check dependencies**: Ensure all dependencies are up to date
5. **Verify secrets**: Ensure all required secrets are configured

---

## 🛠️ Customization

### Modify Python Versions

Edit the matrix in `tests.yml`:

```yaml
strategy:
  matrix:
    python-version: ['3.11', '3.12', '3.13']  # Add or remove versions
```

### Add More Test Jobs

Add new jobs to `tests.yml`:

```yaml
e2e-tests:
  name: End-to-End Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    # Add your E2E test steps
```

### Customize Deployment

Edit the deployment step in `deploy.yml`:

```yaml
- name: Deploy to server
  run: |
    # Add your deployment commands
    ssh user@server "cd /app && docker-compose pull && docker-compose up -d"
```

### Add Slack Notifications

Add notification step:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

---

## 📝 Best Practices

### For Contributors

1. **Run tests locally** before pushing
2. **Keep workflows fast** - optimize test execution
3. **Use caching** - pip cache is enabled
4. **Write meaningful commit messages**
5. **Update documentation** when changing workflows

### For Maintainers

1. **Review workflow runs** regularly
2. **Keep actions up to date** - use Dependabot
3. **Monitor build times** - optimize slow steps
4. **Secure secrets** - rotate regularly
5. **Test workflow changes** on feature branches first

---

## 🔐 Security Considerations

### Secrets Management

- ✅ Never commit secrets to the repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Use least privilege access
- ✅ Audit secret usage

### Workflow Security

- ✅ Pin action versions (e.g., `@v4` not `@main`)
- ✅ Review third-party actions before use
- ✅ Limit workflow permissions
- ✅ Use environment protection rules
- ✅ Enable branch protection

### Docker Security

- ✅ Use official base images
- ✅ Scan images for vulnerabilities
- ✅ Don't include secrets in images
- ✅ Use multi-stage builds
- ✅ Run as non-root user

---

## 📈 Performance Optimization

### Caching

Workflows use caching for:
- **pip packages**: Speeds up dependency installation
- **Docker layers**: Speeds up image builds
- **GitHub Actions cache**: Reuses build artifacts

### Parallelization

- Tests run in parallel across Python versions
- Multiple jobs run concurrently
- Docker builds use BuildKit for parallel layer builds

### Optimization Tips

1. **Use matrix strategy** for parallel testing
2. **Cache dependencies** aggressively
3. **Minimize Docker image size**
4. **Skip unnecessary steps** with conditions
5. **Use `continue-on-error`** for non-critical checks

---

## 🐛 Troubleshooting

### Common Issues

#### Tests fail on CI but pass locally

**Possible causes:**
- Different Python versions
- Missing environment variables
- Database connection issues
- Timing issues in tests

**Solutions:**
- Use same Python version locally
- Check test environment setup
- Add proper waits in tests
- Review CI logs carefully

#### Docker build fails

**Possible causes:**
- Dockerfile syntax errors
- Missing dependencies
- Network issues
- Insufficient disk space

**Solutions:**
- Test Dockerfile locally
- Check dependency versions
- Retry the build
- Clean up old images

#### Deployment fails

**Possible causes:**
- Invalid secrets
- Network connectivity
- Server issues
- Permission problems

**Solutions:**
- Verify all secrets are set
- Check server status
- Review deployment logs
- Test SSH connection manually

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Codecov Action](https://github.com/codecov/codecov-action)
- [pytest Documentation](https://docs.pytest.org/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🤝 Contributing

When modifying workflows:

1. **Test changes** on a feature branch first
2. **Document changes** in this README
3. **Update CHANGELOG.md**
4. **Get review** from maintainers
5. **Monitor first runs** after merging

---

**Last Updated**: October 25, 2024  
**Maintained by**: God Lion Team
