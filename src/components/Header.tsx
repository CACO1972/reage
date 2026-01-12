import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Sparkles } from 'lucide-react';
import { useState } from 'react';
import logoSimetria from '@/assets/logo-simetria.png';

export default function Header() {
  const { user, signOut, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleStartAnalysis = async () => {
    setLoading(true);
    try {
      if (!user) {
        await signInAnonymously();
      }
      navigate('/scan');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error starting analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { href: '#beneficios', label: 'Beneficios' },
    { href: '#faq', label: 'FAQ' },
    { href: '#confianza', label: 'Confianza' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoSimetria} 
              alt="Simetría" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-2">
                    <User className="w-4 h-4" />
                    Mi cuenta
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-white/10 text-white/70 hover:text-white hover:border-white/20"
                >
                  Salir
                </Button>
              </>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleStartAnalysis}
                disabled={loading}
                className="bg-primary/90 hover:bg-primary gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Comenzar gratis
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm text-white/70 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 gap-2">
                      <User className="w-4 h-4" />
                      Mi cuenta
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="w-full border-white/10 text-white/70"
                  >
                    Salir
                  </Button>
                </>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleStartAnalysis}
                  disabled={loading}
                  className="w-full bg-primary/90 hover:bg-primary gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Comenzar gratis
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
