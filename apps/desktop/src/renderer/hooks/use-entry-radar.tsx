import { Entry } from '@colanode/core';
import { useEffect } from 'react';

import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';

export const useEntryRadar = (entry: Entry | null) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    if (!entry) {
      return;
    }

    radar.markEntryAsOpened(workspace.accountId, workspace.id, entry.id);

    const interval = setInterval(() => {
      radar.markEntryAsOpened(workspace.accountId, workspace.id, entry.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [entry?.id]);
};
