# Development Setup Guide

This guide will help you set up the Starlite Blog project for local development.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Project Structure

```
starliteblog/
├── apps/
│   ├── frontend/          # React TypeScript frontend
│   └── backend/           # Node.js Express backend
├── docs/                  # Documentation
├── scripts/               # Database scripts
└── DEVELOPMENT_CHECKLIST.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/MaxBossMan1/starliteblog.git
cd starliteblog
```

### 2. Database Setup

#### Install PostgreSQL
Follow the installation instructions for your operating system:
- **Windows**: Download from postgresql.org
- **macOS**: `brew install postgresql`
- **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database
```bash
# Start PostgreSQL service
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
createdb starliteblog

# Or using psql
psql -U postgres
CREATE DATABASE starliteblog;
\q
```

### 3. Backend Setup

#### Navigate to backend directory
```bash
cd apps/backend
```

#### Install dependencies
```bash
npm install
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

Update your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/starliteblog"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Database Schema Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npm run db:seed
```

#### Start the backend server
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### 4. Frontend Setup

#### Open a new terminal and navigate to frontend directory
```bash
cd apps/frontend
```

#### Install dependencies
```bash
npm install
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file if needed
nano .env
```

Update your `.env` file if needed:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SITE_NAME=Creator's Corner
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_SITE_DESCRIPTION=Insights on Code & Creativity
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NEWSLETTER=true
```

#### Start the frontend development server
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Default Admin Credentials

After seeding the database, you can log in to the admin panel with:

- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@starliteblog.com`
- **Password**: `admin123`

## Development Workflow

### Running Both Servers
You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm start
```

### Database Management

#### View Database in Browser
```bash
cd apps/backend
npx prisma studio
```
This opens a web interface at `http://localhost:5555`

#### Reset Database
```bash
cd apps/backend
npx prisma migrate reset
npm run db:seed
```

#### Generate New Migration
```bash
cd apps/backend
npx prisma migrate dev --name your-migration-name
```

### Code Quality

#### Linting
```bash
# Frontend
cd apps/frontend
npm run lint
npm run lint:fix

# Backend
cd apps/backend
npm run lint
npm run lint:fix
```

#### Formatting
```bash
# Frontend
cd apps/frontend
npm run format

# Backend
cd apps/backend
npm run format
```

## File Upload Setup

Create the uploads directory:
```bash
mkdir -p apps/backend/uploads
```

## Testing the Setup

### 1. Backend Health Check
Visit `http://localhost:5000/health` - should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

### 2. Frontend
Visit `http://localhost:3000` - should display the blog homepage

### 3. Admin Panel
1. Visit `http://localhost:3000/admin`
2. Login with the default credentials
3. Should redirect to the admin dashboard

### 4. API Endpoints
Test some API endpoints:
```bash
# Get posts
curl http://localhost:5000/api/posts

# Get categories
curl http://localhost:5000/api/categories

# Get tags
curl http://localhost:5000/api/tags
```

## Common Issues and Solutions

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify database exists: `psql -l`

### Port Already in Use
```bash
# Kill process on port 3000 or 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Prisma Issues
```bash
# Reset Prisma
cd apps/backend
rm -rf node_modules
rm -rf prisma/generated
npm install
npx prisma generate
```

### Module Not Found Errors
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- Prisma
- TypeScript Importer
- Auto Rename Tag
- GitLens

### Useful Commands

#### Backend
```bash
cd apps/backend

# View logs
npm run dev | bunyan

# Database reset
npm run db:reset

# Type checking
npm run type-check
```

#### Frontend
```bash
cd apps/frontend

# Build for production
npm run build

# Run tests
npm test

# Bundle analyzer
npm run build && npx serve -s build
```

## Next Steps

After successful setup:

1. **Explore the codebase** - Check the development checklist
2. **Create your first post** - Use the admin panel
3. **Customize the design** - Modify Tailwind components
4. **Add new features** - Follow the project structure
5. **Deploy to production** - See deployment guide

## Getting Help

- Check the [API Documentation](../api/README.md)
- Review the [Development Checklist](../../DEVELOPMENT_CHECKLIST.md)
- Look at existing code for patterns
- Check the GitHub issues for known problems

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

Follow the coding standards and commit message format described in the project rules.