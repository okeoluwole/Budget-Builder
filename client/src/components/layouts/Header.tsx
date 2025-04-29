import React from 'react';
import { Link } from 'wouter';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button - only shown on mobile */}
          <button 
            type="button" 
            className="text-gray-500 hover:text-gray-600 focus:outline-none md:hidden"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Display app title only on mobile, since sidebar has the title on desktop */}
          <h1 className="text-lg font-semibold ml-3 text-gray-800 md:hidden">Fitout Cost Budget Tool</h1>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-4">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              className="w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          
          <button type="button" className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="ml-3 relative">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">John Doe</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
