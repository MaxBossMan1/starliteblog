import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Shared/Header';
import Footer from '../components/Shared/Footer';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
  readingTime?: number;
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

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts?limit=6`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    setSubscribeMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubscribeMessage(data.message);
        setEmail('');
      } else {
        setSubscribeMessage(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setSubscribeMessage('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 md:px-8 flex-grow">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="glass-panel p-8 md:p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-violet-ltci">
              Insights on Code &amp; Creativity
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Exploring the intersection of software engineering, content creation, and the digital landscape.
            </p>
            <a 
              href="#latest-posts"
              className="bg-byzantium hover:bg-violet-ltci text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-300 inline-flex items-center"
            >
              Explore Articles
              <span className="material-icons ml-2">arrow_forward</span>
            </a>
          </div>
        </section>

        {/* Latest Posts Section */}
        <section className="mb-16" id="latest-posts">
          <h3 className="text-3xl font-semibold mb-8 text-center text-violet-ltci">
            Latest Posts
          </h3>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <article key={post.id} className="glass-panel p-6 custom-shadow flex flex-col hover-lift">
                  <img 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mb-4" 
                    src={post.featuredImage || 'https://via.placeholder.com/400x300?text=Blog+Post'}
                  />
                  <div className="flex-grow">
                    <h4 className="text-xl font-semibold mb-2 text-byzantium">
                      {post.title}
                    </h4>
                    <p className="text-gray-500 text-sm mb-1">
                      Published on: {formatDate(post.publishedAt)}
                      {post.readingTime && ` • ${post.readingTime} min read`}
                    </p>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
                      {post.excerpt}
                    </p>
                    
                    {/* Categories and Tags */}
                    <div className="mb-4">
                      {post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.categories.map(category => (
                            <span 
                              key={category.id}
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: category.color || '#7C3AED',
                                color: 'white'
                              }}
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag.id}
                              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded"
                            >
                              #{tag.name}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/post/${post.slug}`}
                    className="mt-auto text-byzantium hover:text-violet-ltci font-medium inline-flex items-center self-start"
                  >
                    Read More 
                    <span className="material-icons text-sm ml-1">chevron_right</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link 
              to="/articles"
              className="border border-byzantium text-byzantium hover:bg-byzantium hover:text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-300 inline-flex items-center"
            >
              Load More Posts
              <span className="material-icons ml-2">refresh</span>
            </Link>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="my-16">
          <div className="glass-panel p-8 md:p-12 text-center custom-shadow">
            <h3 className="text-3xl font-semibold mb-4 text-violet-ltci">
              Stay Updated!
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Subscribe to my newsletter to get the latest articles, project updates, and insights directly to your inbox.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full sm:w-auto flex-grow bg-white/70 border border-violet-ltci/50 text-dark-purple placeholder-gray-500 px-4 py-3 rounded-lg focus:ring-2 focus:ring-byzantium focus:border-transparent outline-none transition-all"
                required
                disabled={subscribing}
              />
              <button 
                type="submit"
                disabled={subscribing}
                className="w-full sm:w-auto bg-byzantium hover:bg-violet-ltci text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-300 disabled:opacity-50"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            
            {subscribeMessage && (
              <p className={`mt-4 ${subscribeMessage.includes('success') || subscribeMessage.includes('subscribed') ? 'text-green-600' : 'text-red-600'}`}>
                {subscribeMessage}
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;