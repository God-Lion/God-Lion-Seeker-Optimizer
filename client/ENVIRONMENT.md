# Environment Configuration

## Client Configuration

The client application uses Vite environment variables for configuration. Create the appropriate `.env` file in the `client/` directory:

### Development (`.env.development`)
```bash
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=development
```

### Production (`.env.production`)
```bash
VITE_API_URL=https://api.godlionseeker.com
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=production
```

## Environment Variables

### `VITE_API_URL`
- **Required**: Yes
- **Description**: Backend API base URL
- **Development**: `http://localhost:8000`
- **Production**: Must use HTTPS (e.g., `https://api.godlionseeker.com`)
- **Security**: Production builds will fail if using HTTP

### `VITE_API_TIMEOUT`
- **Required**: No
- **Description**: API request timeout in milliseconds
- **Default**: `30000` (30 seconds)

### `VITE_ENVIRONMENT`
- **Required**: No
- **Description**: Environment identifier
- **Values**: `development` | `production`

## Setup Instructions

1. Copy the example file:
   ```bash
   cd client
   cp .env.example .env.development
   ```

2. Update the values for your environment

3. For production deployment, create `.env.production` with HTTPS URLs

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.production` with real production URLs
- Production API URLs must use HTTPS
- The application will throw an error if HTTP is used in production
- Environment files are git-ignored by default

## Verification

To verify your configuration:
```bash
npm run dev  # Development mode
npm run build  # Production build (will validate HTTPS)
```
