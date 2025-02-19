import { Node } from '@colanode/core';
import { useEffect } from 'react';

import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';

export const useNodeRadar = (node: Node | null) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    if (!node) {
      return;
    }

    radar.markNodeAsOpened(workspace.accountId, workspace.id, node.id);

    const interval = setInterval(() => {
      radar.markNodeAsOpened(workspace.accountId, workspace.id, node.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [node?.id]);
};
