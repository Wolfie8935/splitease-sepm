
import React, { useState } from 'react';
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
import { 
  DollarSign, 
  Home, 
  Users, 
  PieChart, 
  LogOut, 
  User, 
  Menu, 
  X,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userInitial = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="bg-background border-b py-3 px-4 sticky top-0 z-10 md:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-1 rounded-md">
                <DollarSign size={20} />
              </div>
              <span className="font-bold text-xl">SplitEase</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-[250px] bg-background border-r z-50 transform transition-transform duration-200 md:hidden overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <DollarSign size={20} />
            </div>
            <span className="font-bold text-lg">SplitEase</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-3 rounded-md text-sm ${
              isActive('/dashboard')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          
          <Link
            to="/groups"
            className={`flex items-center px-4 py-3 rounded-md text-sm ${
              isActive('/groups')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="mr-3 h-5 w-5" />
            Groups
          </Link>
          
          <Link
            to="/analytics"
            className={`flex items-center px-4 py-3 rounded-md text-sm ${
              isActive('/analytics')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <PieChart className="mr-3 h-5 w-5" />
            Analytics
          </Link>

          <Link
            to="/profile"
            className={`flex items-center px-4 py-3 rounded-md text-sm ${
              isActive('/profile')
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <User className="mr-3 h-5 w-5" />
            Profile
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r bg-background hidden md:block">
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-md">
                <DollarSign size={24} />
              </div>
              <span className="font-bold text-xl">SplitEase</span>
            </Link>
          </div>
          
          <nav className="px-4 py-2 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                isActive('/dashboard')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            
            <Link
              to="/groups"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                isActive('/groups')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
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
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <PieChart className="mr-3 h-5 w-5" />
              Analytics
            </Link>
            
            <Link
              to="/profile"
              className={`flex items-center px-4 py-3 rounded-md text-sm ${
                isActive('/profile')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Link>
          </nav>
          
          <div className="absolute bottom-0 w-64 border-t p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-start px-4">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{currentUser.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 bg-background overflow-y-auto">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
