import { cn } from '@/shared/lib/utils';

interface NotificationBadgeProps {
  count: number;
  unseen: boolean;
  className?: string;
}

export const NotificationBadge = ({
  count,
  unseen,
  className,
}: NotificationBadgeProps) => {
  if (count === 0 && !unseen) {
    return null;
  }

  if (count > 0) {
    return (
      <span
        className={cn(
          'mr-1 rounded-md px-1 py-0.5 text-xs bg-red-400 text-white',
          className
        )}
      >
        {count}
      </span>
    );
  }

  return <span className={cn('size-2 rounded-full bg-red-500', className)} />;
};
