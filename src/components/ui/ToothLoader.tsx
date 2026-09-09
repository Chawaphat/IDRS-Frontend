import { Lottie } from 'lottie-react';
import cleanToothAnimation from '@/assets/animations/clean-tooth.json';
import { cn } from '@/lib/utils';

interface ToothLoaderIconProps {
  className?: string;
}

/**
 * Shared loading glyph — replaces the plain spinning-ring loaders across the
 * chart forms. The source Lottie's tooth outline itself is static (only a
 * small one-shot sparkle animates), so it reads as frozen at a glance —
 * wrapping it in a continuous bounce is what actually signals "still loading."
 */
export function ToothLoaderIcon({ className = 'w-16 h-16' }: ToothLoaderIconProps) {
  return (
    <div className="animate-bounce">
      <Lottie src={cleanToothAnimation} autoplay loop className={cn(className, '-my-2')} />
    </div>
  );
}
