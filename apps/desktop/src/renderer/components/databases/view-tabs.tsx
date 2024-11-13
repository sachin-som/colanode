import { ViewTab } from '@/renderer/components/databases/view-tab';
import { ViewCreateButton } from '@/renderer/components/databases/view-create-button';
import { useDatabaseViews } from '@/renderer/contexts/database-views';
import { useDatabase } from '@/renderer/contexts/database';

export const ViewTabs = () => {
  const database = useDatabase();
  const databaseViews = useDatabaseViews();

  return (
    <div className="flex flex-row items-center gap-3">
      {databaseViews.views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === databaseViews.activeViewId}
          onClick={() => databaseViews.setActiveViewId(view.id)}
        />
      ))}
      {database.canEdit && <ViewCreateButton />}
    </div>
  );
};
