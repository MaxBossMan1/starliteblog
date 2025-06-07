import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    {
      name: 'GitHub',
      url: '#',
      icon: (
        <svg className="h-6 w-6 inline-block" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
        </svg>
      ),
    },
    {
      name: 'Twitter',
      url: '#',
      icon: (
        <svg className="h-6 w-6 inline-block" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.48 2.96,10.28 2.38,10V10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.45,16.03 6.17,17.25 8.25,17.29C6.78,18.46 4.99,19.12 3.08,19.12C2.74,19.12 2.4,19.1 2.07,19.07C4.15,20.41 6.58,21.25 9.29,21.25C16.79,21.25 20.34,14.97 20.34,9.54C20.34,9.34 20.34,9.14 20.33,8.94C21.11,8.4 21.85,7.27 22.46,6Z"></path>
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: '#',
      icon: (
        <svg className="h-6 w-6 inline-block" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
        </svg>
      ),
    },
  ];

  return (
    <footer className="py-8 px-4 md:px-8 mt-16 glass-panel">
      <div className="container mx-auto text-center text-gray-500">
        {/* Social Links */}
        <div className="mb-4">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              className="text-gray-500 hover:text-byzantium mx-2 transition-colors"
              aria-label={link.name}
            >
              {link.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p>© {currentYear} Creator's Corner. All Rights Reserved.</p>
        <p className="text-sm mt-1">
          Designed with <span className="text-byzantium">♥</span> using modern tech.
        </p>

        {/* Additional Links */}
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="#" className="text-gray-500 hover:text-byzantium transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-byzantium transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 hover:text-byzantium transition-colors">
              Contact
            </a>
            <a href="/admin" className="text-gray-500 hover:text-byzantium transition-colors">
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;