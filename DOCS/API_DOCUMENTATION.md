# 📡 API Documentation

Complete API reference for God Lion Seeker Optimizer.

## Base URL

```
http://localhost:8000
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Using the Token

Include the token in the Authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## API Endpoints

### 🔐 Authentication

#### Register New User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "created_at": "2024-10-25T10:00:00Z"
}
```

#### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "is_active": true
}
```

---

### 🔍 Job Scraping

#### Start Job Search

```http
POST /api/scraping/search
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "platforms": ["linkedin", "indeed"],
  "keywords": "python developer",
  "location": "Remote",
  "max_results": 50,
  "experience_level": "mid",
  "job_type": "full-time"
}
```

**Response:** `202 Accepted`
```json
{
  "task_id": "abc123",
  "status": "pending",
  "message": "Job search started"
}
```

#### Get Scraping Status

```http
GET /api/scraping/status/{task_id}
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "task_id": "abc123",
  "status": "completed",
  "progress": 100,
  "jobs_found": 45,
  "completed_at": "2024-10-25T10:05:00Z"
}
```

---

### 💼 Jobs

#### List All Jobs

```http
GET /api/jobs?skip=0&limit=20
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum records to return (default: 20)
- `platform` (string): Filter by platform
- `keywords` (string): Search keywords
- `location` (string): Filter by location

**Response:** `200 OK`
```json
{
  "total": 150,
  "jobs": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "company": "Tech Corp",
      "location": "Remote",
      "salary_range": "$120k - $150k",
      "description": "We are looking for...",
      "platform": "linkedin",
      "url": "https://linkedin.com/jobs/123",
      "posted_date": "2024-10-20",
      "created_at": "2024-10-25T10:00:00Z"
    }
  ]
}
```

#### Get Job Details

```http
GET /api/jobs/{job_id}
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Senior Python Developer",
  "company": "Tech Corp",
  "location": "Remote",
  "salary_range": "$120k - $150k",
  "description": "Full job description...",
  "requirements": ["Python", "FastAPI", "Docker"],
  "benefits": ["Health insurance", "401k"],
  "platform": "linkedin",
  "url": "https://linkedin.com/jobs/123",
  "posted_date": "2024-10-20",
  "match_score": 85.5
}
```

#### Get Matched Jobs

```http
GET /api/jobs/matched?min_score=70
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `min_score` (float): Minimum match score (0-100)
- `limit` (int): Maximum results

**Response:** `200 OK`
```json
{
  "total": 25,
  "jobs": [
    {
      "job": {...},
      "match_score": 92.5,
      "match_reasons": [
        "Skills match: Python, FastAPI, Docker",
        "Experience level matches",
        "Salary in desired range"
      ]
    }
  ]
}
```

#### Save Job

```http
POST /api/jobs/{job_id}/save
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Job saved successfully",
  "saved_at": "2024-10-25T10:00:00Z"
}
```

#### Apply to Job

```http
POST /api/jobs/{job_id}/apply
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "cover_letter": "Dear Hiring Manager...",
  "resume_id": 1
}
```

**Response:** `200 OK`
```json
{
  "application_id": 123,
  "status": "submitted",
  "applied_at": "2024-10-25T10:00:00Z"
}
```

---

### 👤 User Profile

#### Get Profile

```http
GET /api/profiles/{user_id}
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "skills": ["Python", "FastAPI", "Docker", "AWS"],
  "experience_years": 5,
  "desired_salary": 120000,
  "desired_locations": ["Remote", "New York"],
  "job_preferences": {
    "job_type": "full-time",
    "remote": true,
    "experience_level": "senior"
  },
  "resume_url": "/resumes/user_1_resume.pdf"
}
```

#### Update Profile

```http
PUT /api/profiles/{user_id}
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "skills": ["Python", "FastAPI", "Docker", "Kubernetes"],
  "experience_years": 6,
  "desired_salary": 130000,
  "desired_locations": ["Remote"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "profile": {...}
}
```

#### Upload Resume

```http
POST /api/profiles/{user_id}/resume
Authorization: Bearer TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Resume file (PDF, DOCX, TXT)

**Response:** `200 OK`
```json
{
  "message": "Resume uploaded successfully",
  "resume_url": "/resumes/user_1_resume.pdf",
  "extracted_skills": ["Python", "FastAPI", "Docker"]
}
```

---

### 🏢 Companies

#### List Companies

```http
GET /api/companies?skip=0&limit=20
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "total": 50,
  "companies": [
    {
      "id": 1,
      "name": "Tech Corp",
      "industry": "Technology",
      "size": "1000-5000",
      "location": "San Francisco, CA",
      "website": "https://techcorp.com",
      "rating": 4.5,
      "job_count": 15
    }
  ]
}
```

#### Get Company Details

```http
GET /api/companies/{company_id}
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tech Corp",
  "description": "Leading tech company...",
  "industry": "Technology",
  "size": "1000-5000",
  "founded": 2010,
  "headquarters": "San Francisco, CA",
  "website": "https://techcorp.com",
  "rating": 4.5,
  "reviews_count": 250,
  "open_positions": 15
}
```

---

### 📊 Analytics & Statistics

#### Get Dashboard Stats

```http
GET /api/dashboard/stats
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "total_jobs": 150,
  "saved_jobs": 25,
  "applications": 10,
  "interviews": 3,
  "offers": 1,
  "average_match_score": 78.5,
  "recent_activity": [...]
}
```

#### Get Job Statistics

```http
GET /api/statistics/jobs
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "total_jobs": 150,
  "by_platform": {
    "linkedin": 80,
    "indeed": 70
  },
  "by_location": {
    "Remote": 60,
    "New York": 40,
    "San Francisco": 30
  },
  "salary_trends": {
    "average": 125000,
    "median": 120000,
    "min": 80000,
    "max": 180000
  }
}
```

---

### 🔔 Notifications

#### Get Notifications

```http
GET /api/notifications?unread_only=true
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "total": 5,
  "notifications": [
    {
      "id": 1,
      "type": "new_job_match",
      "title": "New High Match Job",
      "message": "Found a 95% match for Python Developer",
      "read": false,
      "created_at": "2024-10-25T10:00:00Z"
    }
  ]
}
```

#### Mark as Read

```http
PUT /api/notifications/{notification_id}/read
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Notification marked as read"
}
```

---

### 🤖 Automation

#### Create Automation Rule

```http
POST /api/automation/rules
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "name": "Auto-apply to Python jobs",
  "enabled": true,
  "conditions": {
    "keywords": ["python", "developer"],
    "min_match_score": 80,
    "locations": ["Remote"]
  },
  "actions": {
    "auto_apply": true,
    "notify": true
  }
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Auto-apply to Python jobs",
  "enabled": true,
  "created_at": "2024-10-25T10:00:00Z"
}
```

#### List Automation Rules

```http
GET /api/automation/rules
Authorization: Bearer TOKEN
```

**Response:** `200 OK`
```json
{
  "rules": [
    {
      "id": 1,
      "name": "Auto-apply to Python jobs",
      "enabled": true,
      "executions": 15,
      "last_run": "2024-10-25T09:00:00Z"
    }
  ]
}
```

---

### 🎯 Career Recommendations (Guest Access)

#### Get Career Insights

```http
POST /api/career/insights
```

**Request Body:**
```json
{
  "skills": ["Python", "JavaScript"],
  "experience_years": 3,
  "current_role": "Junior Developer"
}
```

**Response:** `200 OK`
```json
{
  "recommended_roles": [
    {
      "title": "Full Stack Developer",
      "match_score": 85,
      "growth_potential": "high",
      "average_salary": 110000
    }
  ],
  "skill_gaps": ["Docker", "Kubernetes"],
  "learning_paths": [...]
}
```

---

### 🏥 Health & Monitoring

#### Health Check

```http
GET /api/health
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "uptime": 86400
}
```

#### Metrics (Prometheus)

```http
GET /metrics
```

**Response:** Prometheus metrics format

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "status_code": 400,
  "detail": "Detailed error information"
}
```

### Common Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `202 Accepted` - Request accepted for processing
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- **Anonymous users**: 10 requests/minute
- **Authenticated users**: 100 requests/minute
- **Premium users**: 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635174000
```

---

## Pagination

List endpoints support pagination:

```http
GET /api/jobs?skip=20&limit=10
```

Response includes pagination metadata:
```json
{
  "total": 150,
  "skip": 20,
  "limit": 10,
  "items": [...]
}
```

---

## Filtering & Sorting

### Filtering

```http
GET /api/jobs?platform=linkedin&location=Remote&min_salary=100000
```

### Sorting

```http
GET /api/jobs?sort_by=posted_date&order=desc
```

---

## Webhooks

Configure webhooks to receive real-time updates:

```http
POST /api/webhooks
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["job.matched", "application.status_changed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

- `job.matched` - New job matches your profile
- `application.status_changed` - Application status updated
- `scraping.completed` - Scraping task completed
- `notification.created` - New notification

---

## SDKs & Client Libraries

### Python

```python
from godlion_client import GodLionClient

client = GodLionClient(api_key="your_api_key")
jobs = client.jobs.search(keywords="python developer", location="Remote")
```

### JavaScript

```javascript
import { GodLionClient } from 'godlion-js';

const client = new GodLionClient({ apiKey: 'your_api_key' });
const jobs = await client.jobs.search({ keywords: 'python developer' });
```

---

## Interactive Documentation

Visit the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI Spec**: http://localhost:8000/api/openapi.json

---

## Support

For API support:
- GitHub Issues: https://github.com/God-Lion/God-Lion-Seeker-Optimizer/issues
- Documentation: https://github.com/God-Lion/God-Lion-Seeker-Optimizer#readme
