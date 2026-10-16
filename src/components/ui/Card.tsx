import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ children, className = '', padded = true }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-black/5 shadow-sm ${
        padded ? 'p-6 sm:p-8' : ''
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}