# Blog API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most admin endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@starliteblog.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "admin@starliteblog.com",
    "name": "Admin User",
    "isAdmin": true
  },
  "token": "jwt_token_here"
}
```

#### GET /auth/me
Get current user information (requires authentication).

#### POST /auth/register-admin
Register a new admin user (requires admin authentication).

#### PUT /auth/change-password
Change password (requires authentication).

### Posts

#### GET /posts
Get all published posts (public).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 10)
- `category` (string): Filter by category slug
- `tag` (string): Filter by tag slug
- `search` (string): Search in title, excerpt, content

**Response:**
```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### GET /posts/:slug
Get a single post by slug (public).

#### GET /posts/admin/all
Get all posts including drafts (admin only).

#### POST /posts
Create a new post (admin only).

**Request:**
```json
{
  "title": "Post Title",
  "content": "Post content in markdown",
  "excerpt": "Short description",
  "metaDescription": "SEO meta description",
  "isPublished": false,
  "categoryIds": ["category_id"],
  "tagIds": ["tag_id"],
  "featuredImage": "image_url",
  "readingTime": 5
}
```

#### PUT /posts/:id
Update a post (admin only).

#### DELETE /posts/:id
Delete a post (admin only).

### Categories

#### GET /categories
Get all categories with post counts (public).

#### GET /categories/:slug
Get category with associated posts (public).

#### POST /categories
Create a new category (admin only).

**Request:**
```json
{
  "name": "Category Name",
  "description": "Category description",
  "color": "#7C3AED"
}
```

#### PUT /categories/:id
Update a category (admin only).

#### DELETE /categories/:id
Delete a category (admin only).

### Tags

#### GET /tags
Get all tags with post counts (public).

#### GET /tags/:slug
Get tag with associated posts (public).

#### POST /tags
Create a new tag (admin only).

#### PUT /tags/:id
Update a tag (admin only).

#### DELETE /tags/:id
Delete a tag (admin only).

### Media

#### GET /media
Get all media files (admin only).

#### POST /media/upload
Upload a single image file (admin only).

**Form Data:**
- `file`: Image file
- `alt`: Alt text (optional)
- `caption`: Caption (optional)
- `postId`: Associated post ID (optional)

#### POST /media/upload-multiple
Upload multiple image files (admin only).

#### PUT /media/:id
Update media metadata (admin only).

#### DELETE /media/:id
Delete media file (admin only).

#### GET /media/:id
Get single media file info (admin only).

#### GET /media/files/*
Serve uploaded files (public).

### Analytics

#### GET /analytics/dashboard
Get dashboard analytics (admin only).

**Response:**
```json
{
  "overview": {
    "totalPosts": 10,
    "publishedPosts": 8,
    "draftPosts": 2,
    "totalViews": 1250,
    "totalCategories": 5,
    "totalTags": 12,
    "recentViews": 45
  },
  "popularPosts": [...]
}
```

#### GET /analytics/posts/:id
Get analytics for a specific post (admin only).

#### GET /analytics/trends
Get trending analytics (admin only).

#### POST /analytics/track
Track a page view (public).

**Request:**
```json
{
  "postId": "post_id",
  "referrer": "https://example.com"
}
```

### Newsletter

#### POST /newsletter/subscribe
Subscribe to newsletter (public).

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /newsletter/unsubscribe
Unsubscribe from newsletter (public).

#### GET /newsletter/subscribers
Get all subscribers (admin only).

#### GET /newsletter/stats
Get newsletter statistics (admin only).

#### DELETE /newsletter/subscribers/:id
Delete a subscriber (admin only).

#### POST /newsletter/bulk-action
Bulk actions on subscribers (admin only).

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
API requests are limited to 100 requests per 15 minutes per IP address.

## File Upload Limits
- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF, WebP
- Maximum files per upload: 10

## Database Schema

### Users
- `id` - Unique identifier
- `email` - Email address (unique)
- `password` - Hashed password
- `name` - Display name
- `isAdmin` - Admin flag
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Posts
- `id` - Unique identifier
- `title` - Post title
- `slug` - URL slug (unique)
- `content` - Post content (markdown)
- `excerpt` - Short description
- `featuredImage` - Featured image URL
- `metaDescription` - SEO meta description
- `isPublished` - Publication status
- `publishedAt` - Publication timestamp
- `viewCount` - Total view count
- `readingTime` - Estimated reading time
- `authorId` - Author user ID
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Categories
- `id` - Unique identifier
- `name` - Category name (unique)
- `slug` - URL slug (unique)
- `description` - Category description
- `color` - Hex color code
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Tags
- `id` - Unique identifier
- `name` - Tag name (unique)
- `slug` - URL slug (unique)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Media
- `id` - Unique identifier
- `filename` - File name on disk
- `originalName` - Original file name
- `mimeType` - File MIME type
- `size` - File size in bytes
- `url` - Public URL
- `alt` - Alt text
- `caption` - Caption
- `postId` - Associated post ID
- `createdAt` - Upload timestamp
- `updatedAt` - Last update timestamp

### PostAnalytics
- `id` - Unique identifier
- `postId` - Associated post ID
- `viewedAt` - View timestamp
- `ipAddress` - Viewer IP address
- `userAgent` - Browser user agent
- `referrer` - Referrer URL

### Newsletter
- `id` - Unique identifier
- `email` - Subscriber email (unique)
- `isActive` - Subscription status
- `subscribedAt` - Subscription timestamp
- `unsubscribedAt` - Unsubscription timestamp