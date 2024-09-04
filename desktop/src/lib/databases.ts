import { SelectNode } from '@/data/schemas/workspace';
import { Field, FieldType, RecordNode, SelectOption } from '@/types/databases';
import { NodeTypes } from '@/lib/constants';
import { LocalNode } from '@/types/nodes';
import { compareString } from '@/lib/utils';

export const getFieldIcon = (type?: FieldType): string => {
  if (!type) return '';

  switch (type) {
    case 'boolean':
      return 'checkbox-line';
    case 'collaborator':
      return 'user-line';
    case 'created_at':
      return 'calendar-event-line';
    case 'created_by':
      return 'user-received-line';
    case 'date':
      return 'calendar-event-line';
    case 'email':
      return 'mail-line';
    case 'file':
      return 'file-line';
    case 'multi_select':
      return 'list-check';
    case 'number':
      return 'hashtag';
    case 'phone':
      return 'smartphone-line';
    case 'select':
      return 'radio-button-line';
    case 'text':
      return 'text';
    case 'url':
      return 'link';
    default:
      return 'close-line';
  }
};

export const getDefaultFieldWidth = (type: FieldType): number => {
  if (!type) return 0;

  switch (type.toLowerCase()) {
    case 'name':
      return 200;
    case 'autonumber':
      return 150;
    case 'boolean':
      return 100;
    case 'button':
      return 100;
    case 'collaborator':
      return 200;
    case 'created_at':
      return 200;
    case 'created_by':
      return 200;
    case 'date':
      return 200;
    case 'email':
      return 200;
    case 'file':
      return 200;
    case 'formula':
      return 200;
    case 'multi_select':
      return 200;
    case 'number':
      return 150;
    case 'phone':
      return 200;
    case 'relation':
      return 200;
    case 'rollup':
      return 200;
    case 'select':
      return 200;
    case 'text':
      return 200;
    case 'updated_at':
      return 200;
    case 'updated_by':
      return 200;
    case 'url':
      return 200;
    default:
      return 200;
  }
};

interface SelectOptionColor {
  label: string;
  value: string;
  class: string;
}

export const selectOptionColors: SelectOptionColor[] = [
  {
    label: 'Gray',
    value: 'gray',
    class: 'bg-gray-200',
  },
  {
    label: 'Orange',
    value: 'orange',
    class: 'bg-orange-200',
  },
  {
    label: 'Yellow',
    value: 'yellow',
    class: 'bg-yellow-200',
  },
  {
    label: 'Green',
    value: 'green',
    class: 'bg-green-200',
  },
  {
    label: 'Blue',
    value: 'blue',
    class: 'bg-blue-200',
  },
  {
    label: 'Purple',
    value: 'purple',
    class: 'bg-purple-200',
  },
  {
    label: 'Pink',
    value: 'pink',
    class: 'bg-pink-200',
  },
  {
    label: 'Red',
    value: 'red',
    class: 'bg-red-200',
  },
];

export const getSelectOptionColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.class || '';
};

export const getRandomSelectOptionColor = (): string => {
  return selectOptionColors[
    Math.floor(Math.random() * selectOptionColors.length)
  ].value;
};

export const mapField = (
  node: SelectNode,
  selectOptionNodes: SelectNode[],
): Field => {
  const attrsJson = node.attrs;
  const attrs = attrsJson ? JSON.parse(attrsJson) : {};
  const type: FieldType = attrs.type ?? 'text';

  switch (type) {
    case 'boolean': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'boolean',
        index: node.index,
      };
    }
    case 'collaborator': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'collaborator',
        index: node.index,
      };
    }
    case 'created_at': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'created_at',
        index: node.index,
      };
    }
    case 'created_by': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'created_by',
        index: node.index,
      };
    }
    case 'date': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'date',
        index: node.index,
      };
    }
    case 'email': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'email',
        index: node.index,
      };
    }
    case 'file': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'file',
        index: node.index,
      };
    }
    case 'multi_select': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'multi_select',
        index: node.index,
        options: selectOptionNodes.map((option) => buildSelectOption(option)),
      };
    }
    case 'number': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'number',
        index: node.index,
      };
    }
    case 'phone': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'phone',
        index: node.index,
      };
    }
    case 'select': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'select',
        index: node.index,
        options: selectOptionNodes.map((option) => buildSelectOption(option)),
      };
    }
    case 'text': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'text',
        index: node.index,
      };
    }
    case 'url': {
      return {
        id: node.id,
        name: attrs.name,
        type: 'url',
        index: node.index,
      };
    }
  }
};

export const buildSelectOption = (node: SelectNode): SelectOption => {
  const attrsJson = node.attrs;
  const attrs = attrsJson ? JSON.parse(attrsJson) : {};
  return {
    id: node.id,
    name: attrs.name ?? 'Unnamed',
    color: attrs.color ?? 'gray',
  };
};

export const buildRecords = (allNodes: LocalNode[]): RecordNode[] => {
  const recordNodes = allNodes.filter((node) => node.type === NodeTypes.Record);

  const authorNodes = allNodes.filter((node) => node.type === NodeTypes.User);
  const records: RecordNode[] = [];
  const authorMap = new Map<string, LocalNode>();

  for (const author of authorNodes) {
    authorMap.set(author.id, author);
  }

  for (const node of recordNodes) {
    const author = authorMap.get(node.createdBy);
    const record: RecordNode = {
      id: node.id,
      parentId: node.parentId,
      index: node.index,
      attrs: node.attrs,
      createdAt: new Date(node.createdAt),
      createdBy: {
        id: author?.id ?? node.createdBy,
        name: author?.attrs?.name ?? 'Unknown',
        avatar: author?.attrs?.avatar ?? '',
      },
      versionId: node.versionId,
    };

    records.push(record);
  }

  return records.sort((a, b) => compareString(a.index, b.index));
};
