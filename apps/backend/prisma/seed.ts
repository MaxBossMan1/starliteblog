import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@starliteblog.com' },
    update: {},
    create: {
      email: 'admin@starliteblog.com',
      password: hashedPassword,
      name: 'Admin User',
      isAdmin: true,
    },
  });

  console.log('Created admin user:', adminUser);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'web-development' },
      update: {},
      create: {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Articles about frontend and backend web development',
        color: '#7C3AED',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'tutorials' },
      update: {},
      create: {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'Step-by-step guides and tutorials',
        color: '#6D28D9',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'career-tips' },
      update: {},
      create: {
        name: 'Career Tips',
        slug: 'career-tips',
        description: 'Advice for software engineering careers',
        color: '#374151',
      },
    }),
  ]);

  console.log('Created categories:', categories);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: { name: 'TypeScript', slug: 'typescript' },
    }),
    prisma.tag.upsert({
      where: { slug: 'react' },
      update: {},
      create: { name: 'React', slug: 'react' },
    }),
    prisma.tag.upsert({
      where: { slug: 'nodejs' },
      update: {},
      create: { name: 'Node.js', slug: 'nodejs' },
    }),
    prisma.tag.upsert({
      where: { slug: 'tailwindcss' },
      update: {},
      create: { name: 'Tailwind CSS', slug: 'tailwindcss' },
    }),
  ]);

  console.log('Created tags:', tags);

  // Create sample posts
  const posts = [];
  
  const post1 = await prisma.post.upsert({
    where: { slug: 'mastering-tailwind-css-for-modern-ui-design' },
    update: {},
    create: {
      title: 'Mastering Tailwind CSS for Modern UI Design',
      slug: 'mastering-tailwind-css-for-modern-ui-design',
      excerpt: 'Dive deep into the utility-first framework that\'s revolutionizing frontend development. Learn tips, tricks, and best practices.',
      content: `# Mastering Tailwind CSS for Modern UI Design

Tailwind CSS has revolutionized the way we approach styling in modern web development. This utility-first CSS framework provides a comprehensive set of pre-built classes that make it incredibly efficient to build beautiful, responsive interfaces.

## Why Tailwind CSS?

Unlike traditional CSS frameworks like Bootstrap, Tailwind CSS takes a utility-first approach. Instead of providing pre-designed components, it gives you low-level utility classes to build your own unique designs.

### Key Benefits:

1. **Rapid Development**: Build interfaces faster with utility classes
2. **Consistent Design**: Maintain design consistency across your application
3. **Responsive Design**: Built-in responsive utilities make mobile-first design easy
4. **Customization**: Highly customizable with your own design system

## Getting Started

\`\`\`bash
npm install tailwindcss
npx tailwindcss init
\`\`\`

## Best Practices

1. Use the configuration file to customize your design system
2. Leverage @apply directive for component classes
3. Use Tailwind's responsive prefixes for mobile-first design
4. Optimize for production with PurgeCSS

Tailwind CSS empowers developers to create stunning interfaces without writing custom CSS, making it an essential tool in modern web development.`,
      metaDescription: 'Learn how to master Tailwind CSS for modern UI design with practical tips and best practices.',
      isPublished: true,
      publishedAt: new Date(),
      readingTime: 5,
      authorId: adminUser.id,
    },
  });

  posts.push(post1);

  const post2 = await prisma.post.upsert({
    where: { slug: 'building-scalable-web-applications-with-nodejs' },
    update: {},
    create: {
      title: 'Building Scalable Web Applications with Node.js',
      slug: 'building-scalable-web-applications-with-nodejs',
      excerpt: 'Exploring architectural patterns and best practices for creating robust and high-performance Node.js applications.',
      content: `# Building Scalable Web Applications with Node.js

Node.js has become the go-to runtime for building scalable web applications. Its event-driven, non-blocking I/O model makes it perfect for data-intensive real-time applications.

## Architecture Patterns

### 1. Microservices Architecture
Break your application into small, independent services that communicate over well-defined APIs.

### 2. MVC Pattern
Organize your code using the Model-View-Controller pattern for better maintainability.

### 3. Event-Driven Architecture
Leverage Node.js's event loop for handling asynchronous operations efficiently.

## Best Practices

1. **Use TypeScript** for better type safety and developer experience
2. **Implement proper error handling** with try-catch blocks and error middleware
3. **Use clustering** to take advantage of multi-core systems
4. **Optimize database queries** with proper indexing and query optimization
5. **Implement caching** strategies for better performance

## Performance Optimization

- Use Node.js clustering to utilize all CPU cores
- Implement database connection pooling
- Use Redis for caching frequently accessed data
- Optimize your database queries and use proper indexing

Building scalable Node.js applications requires careful planning and implementation of proven architectural patterns and best practices.`,
      metaDescription: 'Learn how to build scalable web applications with Node.js using proven architectural patterns and best practices.',
      isPublished: true,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      readingTime: 8,
      authorId: adminUser.id,
    },
  });

  posts.push(post2);

  console.log('Created posts:', posts);

  // Find tags by slug with null checks
  const tailwindTag = tags.find(t => t.slug === 'tailwindcss');
  const nodejsTag = tags.find(t => t.slug === 'nodejs');
  const typescriptTag = tags.find(t => t.slug === 'typescript');

  // Link posts with categories and tags
  await prisma.postCategory.createMany({
    data: [
      { postId: post1.id, categoryId: categories[0].id }, // Web Development
      { postId: post1.id, categoryId: categories[1].id }, // Tutorials
      { postId: post2.id, categoryId: categories[0].id }, // Web Development
    ],
  });

  const postTagData = [];
  if (tailwindTag) {
    postTagData.push({ postId: post1.id, tagId: tailwindTag.id });
  }
  if (nodejsTag) {
    postTagData.push({ postId: post2.id, tagId: nodejsTag.id });
  }
  if (typescriptTag) {
    postTagData.push({ postId: post2.id, tagId: typescriptTag.id });
  }

  if (postTagData.length > 0) {
    await prisma.postTag.createMany({
      data: postTagData,
    });
  }

  console.log('Linked posts with categories and tags');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });