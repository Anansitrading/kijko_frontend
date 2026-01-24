import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

interface CelebrationAnimationProps {
  /** Trigger the celebration */
  active: boolean;
  /** Number of confetti particles */
  particleCount?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Optional sound effect URL (muted by default) */
  soundUrl?: string;
  /** Enable sound (default false) */
  soundEnabled?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  className?: string;
}

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  life: number;
}

// =============================================================================
// Reduced Motion Hook
// =============================================================================

function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// Confetti Colors
// =============================================================================

const CONFETTI_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f97316', // orange
];

// =============================================================================
// Confetti Canvas Component
// =============================================================================

interface ConfettiCanvasProps {
  active: boolean;
  particleCount: number;
  duration: number;
  onComplete?: () => void;
}

function ConfettiCanvas({ active, particleCount, duration, onComplete }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const createParticle = useCallback((id: number, canvasWidth: number): Particle => {
    const x = canvasWidth / 2 + (Math.random() - 0.5) * 100;
    const y = -20;
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;

    return {
      id,
      x,
      y,
      rotation: Math.random() * 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      velocityX: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      velocityY: speed + Math.random() * 3,
      rotationSpeed: (Math.random() - 0.5) * 10,
      life: 1,
    };
  }, []);

  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const progress = elapsed / duration;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update position
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.rotation += particle.rotationSpeed;
      particle.velocityY += 0.15; // Gravity
      particle.life -= 0.005;

      // Skip if off-screen or dead
      if (particle.y > canvas.height + 50 || particle.life <= 0) {
        return false;
      }

      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life;

      // Draw rectangle confetti
      ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);

      ctx.restore();

      return true;
    });

    // Continue animation if there are particles or we're still spawning
    if (particlesRef.current.length > 0 || progress < 0.3) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [duration, onComplete]);

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      if (prefersReducedMotion && active) {
        onComplete?.();
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create initial particles
    particlesRef.current = Array.from({ length: particleCount }, (_, i) =>
      createParticle(i, canvas.width)
    );

    // Spawn additional particles over time
    let spawnCount = 0;
    const spawnInterval = setInterval(() => {
      if (spawnCount < particleCount && canvasRef.current) {
        const newParticles = Array.from({ length: Math.floor(particleCount / 5) }, (_, i) =>
          createParticle(particleCount + spawnCount + i, canvasRef.current!.width)
        );
        particlesRef.current.push(...newParticles);
        spawnCount += newParticles.length;
      } else {
        clearInterval(spawnInterval);
      }
    }, 100);

    // Reset and start animation
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(spawnInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, particleCount, createParticle, animate, prefersReducedMotion, onComplete]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Success Checkmark Component
// =============================================================================

export function SuccessCheckmark({ size = 'md', className, animate = true }: SuccessCheckmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 28,
    md: 40,
    lg: 56,
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-emerald-500/20 border-2 border-emerald-500',
        sizeClasses[size],
        shouldAnimate && 'animate-scale-in',
        className
      )}
    >
      <CheckCircle
        size={iconSizes[size]}
        className={cn(
          'text-emerald-500',
          shouldAnimate && 'animate-draw-check'
        )}
      />
      {shouldAnimate && (
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping-once" />
      )}
    </div>
  );
}

// =============================================================================
// Staggered Reveal Container
// =============================================================================

interface StaggeredRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function StaggeredReveal({ children, delay = 100, className }: StaggeredRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Main Celebration Animation Component
// =============================================================================

export function CelebrationAnimation({
  active,
  particleCount = 100,
  duration = 3000,
  soundUrl,
  soundEnabled = false,
  onComplete,
  className,
}: CelebrationAnimationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play sound effect
  useEffect(() => {
    if (active && soundEnabled && soundUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(soundUrl);
        audioRef.current.volume = 0.3;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play was prevented (e.g., no user interaction yet)
      });
    }
  }, [active, soundEnabled, soundUrl]);

  if (!active) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      <ConfettiCanvas
        active={active}
        particleCount={particleCount}
        duration={duration}
        onComplete={onComplete}
      />
    </div>
  );
}

// =============================================================================
// Celebration Header Component
// =============================================================================

interface CelebrationHeaderProps {
  title: string;
  subtitle?: string;
  showConfetti?: boolean;
  className?: string;
}

export function CelebrationHeader({
  title,
  subtitle,
  showConfetti = true,
  className,
}: CelebrationHeaderProps) {
  const [confettiActive, setConfettiActive] = useState(showConfetti);

  return (
    <div className={cn('relative text-center', className)}>
      {showConfetti && (
        <CelebrationAnimation
          active={confettiActive}
          particleCount={60}
          duration={2500}
          onComplete={() => setConfettiActive(false)}
        />
      )}

      <StaggeredReveal delay={0}>
        <SuccessCheckmark size="lg" className="mx-auto mb-4" />
      </StaggeredReveal>

      <StaggeredReveal delay={200}>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      </StaggeredReveal>

      {subtitle && (
        <StaggeredReveal delay={400}>
          <p className="text-slate-400">{subtitle}</p>
        </StaggeredReveal>
      )}
    </div>
  );
}

// =============================================================================
// CSS Animation Keyframes (add to global CSS or Tailwind config)
// =============================================================================

/*
Add to your tailwind.config.js or global CSS:

@keyframes scale-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes draw-check {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

@keyframes ping-once {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out;
}

.animate-draw-check {
  animation: draw-check 0.5s ease-out 0.3s;
}

.animate-ping-once {
  animation: ping-once 0.6s ease-out;
}
*/
