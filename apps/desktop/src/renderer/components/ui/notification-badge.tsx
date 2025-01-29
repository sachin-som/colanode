interface NotificationBadgeProps {
  count: number;
  unseen: boolean;
}

export const NotificationBadge = ({
  count,
  unseen,
}: NotificationBadgeProps) => {
  if (count === 0 && !unseen) {
    return null;
  }

  if (count > 0) {
    return (
      <span className="mr-1 rounded-md px-1 py-0.5 text-xs bg-red-400 text-white">
        {count}
      </span>
    );
  }

  return <span className="size-2 rounded-full bg-red-500" />;
};
