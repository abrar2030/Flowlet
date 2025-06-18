import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Shield,
  Code,
  BarChart3,
  Settings,
  X,
  Home,
  Users,
  FileText,
  Zap
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home, public: true },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Payments', href: '/payments', icon: ArrowLeftRight },
    { name: 'Cards', href: '/cards', icon: CreditCard },
    { name: 'Compliance', href: '/compliance', icon: Shield },
    { name: 'Developer Portal', href: '/developer', icon: Code },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.public || isAuthenticated
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex justify-end p-4 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          {isAuthenticated && (
            <div className="p-4 border-t border-border">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Quick Actions</span>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ArrowLeftRight className="mr-2 h-3 w-3" />
                    Send Money
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CreditCard className="mr-2 h-3 w-3" />
                    New Card
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

