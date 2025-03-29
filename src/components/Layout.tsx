
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DollarSign, Home, Users, PieChart, LogOut, User, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b py-4 px-4 sticky top-0 z-10 md:hidden">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <DollarSign size={20} />
            </div>
            <span className="font-bold text-xl">Splitly</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="w-full cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/groups" className="w-full cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Groups
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/analytics" className="w-full cursor-pointer">
                  <PieChart className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="w-64 border-r bg-gray-50 hidden md:block">
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-md">
                <DollarSign size={24} />
              </div>
              <span className="font-bold text-xl">Splitly</span>
            </Link>
          </div>
          
          <nav className="px-4 py-2 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                isActive('/dashboard')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            
            <Link
              to="/groups"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                location.pathname.startsWith('/groups')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Groups
            </Link>
            
            <Link
              to="/analytics"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                isActive('/analytics')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PieChart className="mr-3 h-5 w-5" />
              Analytics
            </Link>
          </nav>
          
          <div className="absolute bottom-0 w-64 border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-start px-4">
                  <User className="mr-2 h-4 w-4" />
                  <span className="truncate">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6 bg-gray-50">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
