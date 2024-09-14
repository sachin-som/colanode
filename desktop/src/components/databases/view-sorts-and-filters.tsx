import React from 'react';
import { ViewSorts } from '@/components/databases/sorts/view-sorts';
import { ViewFilters } from '@/components/databases/filters/view-filters';
import { ViewFilterNode, ViewSortNode } from '@/types/databases';
import { Separator } from '@/components/ui/separator';

interface ViewSortsAndFiltersProps {
  viewId: string;
  filters: ViewFilterNode[];
  sorts: ViewSortNode[];
}

export const ViewSortsAndFilters = ({
  viewId,
  filters,
  sorts,
}: ViewSortsAndFiltersProps) => {
  return (
    <div className="mt-3 flex flex-row items-center gap-2">
      {sorts.length > 0 && (
        <React.Fragment>
          <ViewSorts viewId={viewId} sorts={sorts} />
          <Separator orientation="vertical" className="mx-1 h-4" />
        </React.Fragment>
      )}
      <ViewFilters viewId={viewId} filters={filters} />
    </div>
  );
};
