import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Home, Scan, LayoutDashboard, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {showNav && user && (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-semibold text-lg">Simetría</span>
              </Link>

              <div className="flex items-center gap-1">
                <Link to="/">
                  <Button 
                    variant={isActive('/') ? 'secondary' : 'ghost'} 
                    size="sm"
                    className="gap-2"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Inicio</span>
                  </Button>
                </Link>
                <Link to="/scan">
                  <Button 
                    variant={isActive('/scan') ? 'secondary' : 'ghost'} 
                    size="sm"
                    className="gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Escanear</span>
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button 
                    variant={isActive('/dashboard') ? 'secondary' : 'ghost'} 
                    size="sm"
                    className="gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="rounded-full text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={user && showNav ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
}
