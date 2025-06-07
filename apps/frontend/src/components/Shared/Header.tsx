import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Articles', path: '/articles' },
    { name: 'Projects', path: '/projects' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="py-6 px-4 md:px-8 sticky top-0 z-50 glass-panel mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold text-byzantium hover:text-violet-ltci transition-colors">
          Creator's Corner
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-6 text-lg">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.path}
                  className="text-gray-700 hover:text-byzantium transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-40 lg:w-56 px-4 py-2 pl-10 bg-white/70 border border-violet-ltci/30 rounded-lg text-sm focus:ring-2 focus:ring-byzantium focus:border-transparent outline-none transition-all"
              />
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                search
              </span>
            </div>
          </form>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-byzantium transition-colors"
        >
          <span className="material-icons text-2xl">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-violet-ltci/20">
          <ul className="space-y-3 mb-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.path}
                  className="block text-gray-700 hover:text-byzantium transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-4 py-2 pl-10 bg-white/70 border border-violet-ltci/30 rounded-lg text-sm focus:ring-2 focus:ring-byzantium focus:border-transparent outline-none transition-all"
              />
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                search
              </span>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;