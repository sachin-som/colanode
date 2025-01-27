import { useCallback, useState } from 'react';

import { useWorkspace } from '@/renderer/contexts/workspace';
import { percentToNumber } from '@/shared/lib/utils';
import { useWindowSize } from '@/renderer/hooks/use-window-size';
import {
  ContainerMetadata,
  SidebarMenuType,
  SidebarMetadata,
} from '@/shared/types/workspaces';

export const useLayoutState = () => {
  const workspace = useWorkspace();
  const windowSize = useWindowSize();

  const [activeContainer, setActiveContainer] = useState<'left' | 'right'>(
    'left'
  );

  const [sidebarMetadata, setSidebarMetadata] = useState<SidebarMetadata>(
    workspace.getMetadata('sidebar')?.value ?? {
      menu: 'spaces',
      width: 300,
    }
  );

  const [leftContainerMetadata, setLeftContainerMetadata] =
    useState<ContainerMetadata>(
      workspace.getMetadata('left_container')?.value ?? {
        tabs: [],
      }
    );

  const replaceLeftContainerMetadata = useCallback(
    (metadata: ContainerMetadata) => {
      setLeftContainerMetadata(metadata);
      workspace.setMetadata('left_container', {
        ...metadata,
      });
    },
    [workspace, setLeftContainerMetadata]
  );

  const [rightContainerMetadata, setRightContainerMetadata] =
    useState<ContainerMetadata>(
      workspace.getMetadata('right_container')?.value ?? {
        tabs: [],
        width: percentToNumber(windowSize.width, 40),
      }
    );

  const replaceRightContainerMetadata = useCallback(
    (metadata: ContainerMetadata) => {
      setRightContainerMetadata(metadata);
      workspace.setMetadata('right_container', {
        ...metadata,
      });
    },
    [workspace, setRightContainerMetadata]
  );

  const handleSidebarResize = useCallback(
    (width: number) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        width,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        width,
      });
    },
    [workspace, sidebarMetadata]
  );

  const handleMenuChange = useCallback(
    (menu: SidebarMenuType) => {
      setSidebarMetadata({
        ...sidebarMetadata,
        menu,
      });

      workspace.setMetadata('sidebar', {
        ...sidebarMetadata,
        menu,
      });
    },
    [workspace, sidebarMetadata]
  );

  const handleRightContainerResize = useCallback(
    (width: number) => {
      setRightContainerMetadata({
        ...rightContainerMetadata,
        width,
      });

      workspace.setMetadata('right_container', {
        ...rightContainerMetadata,
        width,
      });
    },
    [workspace, rightContainerMetadata]
  );

  const handleOpenLeft = useCallback(
    (tab: string) => {
      const existingTab = leftContainerMetadata.tabs.find((t) => t.id === tab);
      if (existingTab) {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: leftContainerMetadata.tabs.map((t) => ({
            ...t,
            active: t.id === tab ? true : undefined,
            preview: t.id === tab ? undefined : t.preview,
          })),
        });
      } else {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: [
            ...leftContainerMetadata.tabs
              .filter((t) => t.id !== tab)
              .map((t) => ({
                ...t,
                active: undefined,
              })),
            { id: tab, active: true },
          ],
        });
      }
    },
    [leftContainerMetadata]
  );

  const handleOpenRight = useCallback(
    (tab: string) => {
      const existingTab = rightContainerMetadata.tabs.find((t) => t.id === tab);
      if (existingTab) {
        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: rightContainerMetadata.tabs.map((t) => ({
            ...t,
            active: t.id === tab ? true : undefined,
            preview: t.id === tab ? undefined : t.preview,
          })),
        });
      } else {
        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: [
            ...rightContainerMetadata.tabs
              .filter((t) => t.id !== tab)
              .map((t) => ({
                ...t,
                active: undefined,
              })),
            { id: tab, active: true },
          ],
        });
      }
    },
    [rightContainerMetadata]
  );

  const handleOpen = useCallback(
    (tab: string) => {
      if (activeContainer === 'left') {
        handleOpenLeft(tab);
      } else {
        handleOpenRight(tab);
      }
    },
    [activeContainer, handleOpenLeft, handleOpenRight]
  );

  const handleCloseLeft = useCallback(
    (tab: string) => {
      const existingTabIndex = leftContainerMetadata.tabs.findIndex(
        (t) => t.id === tab
      );

      if (existingTabIndex === -1) {
        return;
      }

      const newTabs = leftContainerMetadata.tabs.filter((t) => t.id !== tab);

      // Make the closest tab active, preferring the previous tab
      if (newTabs.length > 0 && !newTabs.some((t) => t.active)) {
        const nextActiveTab =
          newTabs[existingTabIndex - 1] ||
          newTabs[existingTabIndex] ||
          newTabs[0];

        newTabs.forEach((t) => {
          t.active = t.id === nextActiveTab?.id;
        });
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: newTabs,
      });

      // if the left container is empty, but the right container has tabs,
      // move all tabs from the right container to the left container
      if (newTabs.length === 0 && rightContainerMetadata.tabs.length > 0) {
        replaceLeftContainerMetadata({
          ...leftContainerMetadata,
          tabs: rightContainerMetadata.tabs,
        });

        replaceRightContainerMetadata({
          ...rightContainerMetadata,
          tabs: [],
        });

        setActiveContainer('left');
      }
    },
    [leftContainerMetadata, rightContainerMetadata, activeContainer]
  );

  const handleCloseRight = useCallback(
    (tab: string) => {
      const existingTabIndex = rightContainerMetadata.tabs.findIndex(
        (t) => t.id === tab
      );

      if (existingTabIndex === -1) {
        return;
      }

      const newTabs = rightContainerMetadata.tabs.filter((t) => t.id !== tab);

      // Make the closest tab active, preferring the previous tab
      if (newTabs.length > 0 && !newTabs.some((t) => t.active)) {
        const nextActiveTab =
          newTabs[existingTabIndex - 1] ||
          newTabs[existingTabIndex] ||
          newTabs[0];

        newTabs.forEach((t) => {
          t.active = t.id === nextActiveTab?.id;
        });
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: newTabs,
      });

      if (newTabs.length === 0) {
        setActiveContainer('left');
      }
    },
    [rightContainerMetadata]
  );

  const handleClose = useCallback(
    (tab: string) => {
      handleCloseLeft(tab);
      handleCloseRight(tab);
    },
    [handleCloseLeft, handleCloseRight]
  );

  const handlePreviewLeft = useCallback(
    (tab: string, keepCurrent: boolean = false) => {
      const existingTab = leftContainerMetadata.tabs.find((t) => t.id === tab);
      if (existingTab) {
        if (!existingTab.active) {
          replaceLeftContainerMetadata({
            ...leftContainerMetadata,
            tabs: leftContainerMetadata.tabs
              .filter((t) => keepCurrent || !t.preview)
              .map((t) => ({
                ...t,
                active: t.id === tab ? true : undefined,
              })),
          });
        }

        return;
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: [
          ...leftContainerMetadata.tabs
            .filter((t) => keepCurrent || !t.preview)
            .map((t) => ({
              ...t,
              active: undefined,
              preview: undefined,
            })),
          { id: tab, active: true, preview: true },
        ],
      });
    },
    [leftContainerMetadata]
  );

  const handlePreviewRight = useCallback(
    (tab: string, keepCurrent: boolean = false) => {
      const existingTab = rightContainerMetadata.tabs.find((t) => t.id === tab);
      if (existingTab) {
        if (!existingTab.active) {
          replaceRightContainerMetadata({
            ...rightContainerMetadata,
            tabs: rightContainerMetadata.tabs
              .filter((t) => keepCurrent || !t.preview)
              .map((t) => ({
                ...t,
                active: t.id === tab ? true : undefined,
              })),
          });
        }

        return;
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: [
          ...rightContainerMetadata.tabs
            .filter((t) => keepCurrent || !t.preview)
            .map((t) => ({
              ...t,
              active: undefined,
              preview: true,
            })),
          { id: tab, active: true, preview: true },
        ],
      });
    },
    [rightContainerMetadata]
  );

  const handlePreview = useCallback(
    (tab: string, keepCurrent: boolean = false) => {
      if (activeContainer === 'left') {
        handlePreviewLeft(tab, keepCurrent);
      } else {
        handlePreviewRight(tab, keepCurrent);
      }
    },
    [activeContainer, handlePreviewLeft, handlePreviewRight]
  );

  const handleActivateLeft = useCallback(
    (tab: string) => {
      if (!leftContainerMetadata.tabs.some((t) => t.id === tab)) {
        return;
      }

      replaceLeftContainerMetadata({
        ...leftContainerMetadata,
        tabs: leftContainerMetadata.tabs.map((t) => ({
          ...t,
          active: t.id === tab ? true : undefined,
        })),
      });
    },
    [leftContainerMetadata]
  );

  const handleActivateRight = useCallback(
    (tab: string) => {
      if (!rightContainerMetadata.tabs.some((t) => t.id === tab)) {
        return;
      }

      replaceRightContainerMetadata({
        ...rightContainerMetadata,
        tabs: rightContainerMetadata.tabs.map((t) => ({
          ...t,
          active: t.id === tab ? true : undefined,
        })),
      });
    },
    [rightContainerMetadata]
  );

  const handleActivate = useCallback(
    (tab: string) => {
      if (activeContainer === 'left') {
        handleActivateLeft(tab);
      } else {
        handleActivateRight(tab);
      }
    },
    [activeContainer, handleActivateLeft, handleActivateRight]
  );

  const handleFocus = useCallback((side: 'left' | 'right') => {
    setActiveContainer(side);
  }, []);

  return {
    activeContainer,
    sidebarMetadata,
    leftContainerMetadata,
    rightContainerMetadata,
    handleFocus,
    handleOpen,
    handleOpenLeft,
    handleOpenRight,
    handleClose,
    handleCloseLeft,
    handleCloseRight,
    handlePreview,
    handlePreviewLeft,
    handlePreviewRight,
    handleSidebarResize,
    handleMenuChange,
    handleRightContainerResize,
    handleActivate,
    handleActivateLeft,
    handleActivateRight,
  };
};
