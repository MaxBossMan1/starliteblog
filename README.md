# Creator's Corner Blog

A modern blog application built with React, Node.js, and PostgreSQL.

## Project Structure

```
├── DEVELOPMENT_CHECKLIST.md  # Development progress tracking
├── design.html               # Original design file
├── apps/
│   ├── frontend/            # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── utils/       # Frontend utilities
│   │   └── public/          # Static assets
│   └── backend/             # Node.js backend API
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── controllers/ # Route controllers
│       │   ├── middleware/  # Express middleware
│       │   ├── models/      # Database models
│       │   └── utils/       # Backend utilities
│       └── uploads/         # File uploads storage
├── docs/                    # Project documentation
└── scripts/                 # Database scripts and migrations
```

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT
- **File Storage:** Local uploads

## Getting Started

See the `DEVELOPMENT_CHECKLIST.md` for development progress and setup instructions.

## Features

- Modern glassmorphism UI design
- Rich text blog post editor
- Admin panel with analytics
- Image upload and management
- SEO optimization
- Responsive design 