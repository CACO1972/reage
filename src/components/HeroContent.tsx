import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroContent() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Badge */}
      <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Generative Art Experience</span>
      </div>

      {/* Main Headline */}
      <h1 className="animate-fade-up-delayed max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
        <span className="text-foreground">Flow with the </span>
        <span className="text-gradient">Infinite</span>
      </h1>

      {/* Subheadline */}
      <p className="animate-fade-up-delayed-2 mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
        Immerse yourself in an organic particle simulation. 
        Watch as thousands of points dance through curl noise fields, 
        creating mesmerizing patterns in real-time.
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-up-delayed-2 mt-10 flex flex-col gap-4 sm:flex-row">
        <Button variant="hero" size="lg" className="group">
          Explore Now
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
          Learn More
        </Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
