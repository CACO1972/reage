"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Menu, X, User, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { user, signOut, signInAnonymously } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    setMobileMenuOpen(false)
  }

  const handleStartAnalysis = async () => {
    setLoading(true)
    try {
      if (!user) {
        await signInAnonymously()
      }
      router.push('/scan')
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Error starting analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const navLinks = [
    { href: '#beneficios', label: 'Beneficios' },
    { href: '#faq', label: 'FAQ' },
    { href: '#confianza', label: 'Confianza' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-lg text-foreground">
              Simetria<sup className="text-[8px] ml-0.5">®</sup>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                    <User className="w-4 h-4" />
                    Mi cuenta
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-border text-muted-foreground hover:text-foreground hover:border-border/80"
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
                className="gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/10">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-border/10 space-y-3">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground gap-2">
                      <User className="w-4 h-4" />
                      Mi cuenta
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="w-full border-border text-muted-foreground"
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
                  className="w-full gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
  )
}
