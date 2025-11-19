import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { toggleSidebar, setMobileMenuOpen } from '@/store/uiSlice';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  isMobile: boolean;
}

const Layout: React.FC<LayoutProps> = ({ isMobile }) => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, mobileMenuOpen } = useAppSelector(state => state.ui);

  const handleSidebarToggle = () => {
    if (isMobile) {
      dispatch(setMobileMenuOpen(!mobileMenuOpen));
    } else {
      dispatch(toggleSidebar());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={handleSidebarToggle}
        isMobile={isMobile}
      />

      <div className="flex">
        <Sidebar
          isOpen={isMobile ? mobileMenuOpen : sidebarOpen}
          isMobile={isMobile}
          onClose={() => dispatch(setMobileMenuOpen(false))}
        />

        <main
          className={`flex-1 transition-all duration-300 ${
            !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="p-6 pt-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
