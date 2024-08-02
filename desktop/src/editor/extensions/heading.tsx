import { mergeAttributes } from '@tiptap/core';
import Heading from '@tiptap/extension-heading';

import { defaultClasses } from '@/editor/classes';

type Levels = 1 | 2 | 3;

export const HeadingNode = Heading.configure({
  levels: [1, 2, 3],
}).extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level: Levels = hasLevel ? node.attrs.level : this.options.levels[0];

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `${defaultClasses.heading[level]}`,
      }),
      0,
    ];
  },
});
