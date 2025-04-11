import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar with overlay, hidden by default */}
      {sidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 z-50 w-64">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed sidebar for desktop */}
      <div className="hidden md:block md:flex-shrink-0">
        <div className="h-full w-64">
          <Sidebar onClose={() => {}} />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
