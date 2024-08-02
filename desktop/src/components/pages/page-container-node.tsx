import React from 'react';
import {ScrollArea} from "@/components/ui/scroll-area";
import {Node} from '@/types/nodes'
import {PageEditor} from "@/components/pages/page-editor";

interface PageContainerNodeProps {
  node: Node;
}

export const PageContainerNode = ({node}: PageContainerNodeProps) => {
  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <PageEditor node={node} />
    </ScrollArea>
  )
}