import { useView } from '@/renderer/contexts/view';
import { TableViewNameHeader } from '@/renderer/components/databases/tables/table-view-name-header';
import { TableViewFieldHeader } from '@/renderer/components/databases/tables/table-view-field-header';
import { FieldCreatePopover } from '@/renderer/components/databases/fields/field-create-popover';
import { useDatabase } from '@/renderer/contexts/database';

export const TableViewHeader = () => {
  const database = useDatabase();
  const view = useView();

  return (
    <div className="flex flex-row items-center gap-0.5">
      <div style={{ width: '30px', minWidth: '30px' }} />
      <TableViewNameHeader />
      {view.fields.map((field) => {
        return <TableViewFieldHeader viewField={field} key={field.field.id} />;
      })}
      {database.canEdit && <FieldCreatePopover />}
    </div>
  );
};
