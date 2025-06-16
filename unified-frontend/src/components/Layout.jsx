import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ isMobile }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex flex-col min-h-screen">
          <Navbar isMobile={true} />
          <main className="flex-1 p-4 pb-20">
            <Outlet />
          </main>
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
            <Sidebar isMobile={true} />
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="flex min-h-screen">
          <Sidebar isMobile={false} />
          <div className="flex-1 flex flex-col">
            <Navbar isMobile={false} />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

