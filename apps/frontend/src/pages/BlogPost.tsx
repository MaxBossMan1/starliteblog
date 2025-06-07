import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import Header from '../components/Shared/Header';
import Footer from '../components/Shared/Footer';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metaDescription?: string;
  publishedAt: string;
  readingTime?: number;
  viewCount: number;
  author: {
    id: string;
    name: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    // Track page view
    if (post?.id) {
      trackPageView(post.id);
    }
  }, [post]);

  const fetchPost = async (postSlug: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/${postSlug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else {
          throw new Error('Failed to fetch post');
        }
        return;
      }
      const postData = await response.json();
      setPost(postData);
      
      // Fetch related posts based on categories
      if (postData.categories.length > 0) {
        fetchRelatedPosts(postData.categories[0].slug, postData.id);
      }
    } catch (err) {
      setError('Failed to load post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (categorySlug: string, currentPostId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts?category=${categorySlug}&limit=3`
      );
      if (response.ok) {
        const data = await response.json();
        const related = data.posts.filter((p: BlogPost) => p.id !== currentPostId);
        setRelatedPosts(related.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  const trackPageView = async (postId: string) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          referrer: document.referrer,
        }),
      });
    } catch (err) {
      // Silent fail for analytics
      console.error('Analytics tracking failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 md:px-8 flex-grow">
          <div className="glass-panel p-8 animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 md:px-8 flex-grow">
          <div className="glass-panel p-8 text-center">
            <h1 className="text-3xl font-bold mb-4 text-red-600">
              {error || 'Post not found'}
            </h1>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              to="/"
              className="bg-byzantium hover:bg-violet-ltci text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 md:px-8 flex-grow max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-byzantium hover:text-violet-ltci">
            Home
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-600">{post.title}</span>
        </nav>

        {/* Article */}
        <article className="glass-panel p-8 md:p-12 mb-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-violet-ltci leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
              <div className="flex items-center">
                <span className="material-icons text-sm mr-1">person</span>
                <span>{post.author.name}</span>
              </div>
              
              <div className="flex items-center">
                <span className="material-icons text-sm mr-1">calendar_today</span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              
              {post.readingTime && (
                <div className="flex items-center">
                  <span className="material-icons text-sm mr-1">schedule</span>
                  <span>{post.readingTime} min read</span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="material-icons text-sm mr-1">visibility</span>
                <span>{post.viewCount} views</span>
              </div>
            </div>

            {/* Categories and Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map(category => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: category.color || '#7C3AED' }}
                >
                  {category.name}
                </Link>
              ))}
              
              {post.tags.map(tag => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.slug}`}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
            
            {/* Featured Image */}
            {post.featuredImage && (
              <img 
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
              />
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize, rehypeHighlight]}
              components={{
                h1: (props) => (
                  <h1 className="text-3xl font-bold mb-4 text-violet-ltci">{props.children}</h1>
                ),
                h2: (props) => (
                  <h2 className="text-2xl font-semibold mb-3 text-byzantium">{props.children}</h2>
                ),
                h3: (props) => (
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{props.children}</h3>
                ),
                p: (props) => (
                  <p className="mb-4">{props.children}</p>
                ),
                strong: (props) => (
                  <strong className="font-semibold">{props.children}</strong>
                ),
                em: (props) => (
                  <em className="italic">{props.children}</em>
                ),
                code: (props) => {
                  const isInline = !props.className;
                  if (isInline) {
                    return (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {props.children}
                      </code>
                    );
                  }
                  return (
                    <code className={props.className}>
                      {props.children}
                    </code>
                  );
                },
                pre: (props) => (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                    {props.children}
                  </pre>
                ),
                ul: (props) => (
                  <ul className="mb-4 pl-6">{props.children}</ul>
                ),
                ol: (props) => (
                  <ol className="mb-4 pl-6">{props.children}</ol>
                ),
                li: (props) => (
                  <li className="mb-1">{props.children}</li>
                ),
                blockquote: (props) => (
                  <blockquote className="border-l-4 border-violet-ltci pl-4 italic mb-4">
                    {props.children}
                  </blockquote>
                ),
                a: (props) => (
                  <a 
                    href={props.href} 
                    className="text-violet-ltci hover:text-byzantium underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {props.children}
                  </a>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Share Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-byzantium">Share this article</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span className="material-icons text-sm mr-2">share</span>
                Twitter
              </a>
              
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span className="material-icons text-sm mr-2">share</span>
                LinkedIn
              </a>
              
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons text-sm mr-2">link</span>
                Copy Link
              </button>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-violet-ltci">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <article key={relatedPost.id} className="glass-panel p-4 hover-lift">
                  <img 
                    src={relatedPost.featuredImage || 'https://via.placeholder.com/300x200?text=Blog+Post'}
                    alt={relatedPost.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold mb-2 text-byzantium">
                    <Link to={`/post/${relatedPost.slug}`} className="hover:text-violet-ltci">
                      {relatedPost.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {relatedPost.excerpt}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(relatedPost.publishedAt)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;