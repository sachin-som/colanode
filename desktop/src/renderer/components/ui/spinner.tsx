import * as React from 'react';

import { cn } from '@/lib/utils';
import { Icon } from '@/renderer/components/ui/icon';

export interface SpinnerProps {
  className?: string;
  size?: string | number | undefined;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...props }, ref) => (
    <Icon
      name="loader-4-line"
      className={cn('animate-spin', className)}
      ref={ref}
      {...props}
    />
  ),
);
Spinner.displayName = 'Spinner';

export { Spinner };
