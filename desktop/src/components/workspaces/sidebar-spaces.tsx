import React from 'react';
import {SpaceCreateButton} from "@/components/spaces/space-create-button";

export function SidebarSpaces() {
  const canAddEntities = true;

  return (
    <div className="pt-3 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Spaces</span>
        {canAddEntities && <SpaceCreateButton />}
      </div>
      <div className="flex flex-col gap-0.5">
        {[].map((space) =>
          space != null ? (
            <p>space goes here.</p>
          ) : null,
        )}
      </div>
    </div>
  )
}