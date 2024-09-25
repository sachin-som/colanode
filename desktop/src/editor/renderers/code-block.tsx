import React from 'react';

import { Icon } from '@/components/ui/icon';
import { defaultClasses } from '@/editor/classes';
import { LocalNodeWithChildren } from '@/types/nodes';
import { highlightCode, languages } from '@/lib/lowlight';

interface CodeBlockRendererProps {
  node: LocalNodeWithChildren;
  keyPrefix: string | null;
}

export const CodeBlockRenderer = ({
  node,
  keyPrefix,
}: CodeBlockRendererProps) => {
  const language = node.attributes.language;

  const [copied, setCopied] = React.useState(false);

  const code = node.attributes.content?.[0].text ?? '';
  if (!code) {
    return null;
  }

  const highlight = highlightCode(code, language);
  const languageItem = languages?.find((item) => item.code === language);
  const languageName = languageItem?.name ?? language ?? ' ';

  return (
    <pre className={defaultClasses.codeBlock}>
      <div className={defaultClasses.codeBlockHeader}>
        {<p>{languageName}</p>}
        <div
          className="flex cursor-pointer flex-row items-center gap-1"
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
            });
          }}
        >
          <Icon name="clipboard-line" />
          <p>{copied ? 'Copied' : 'Copy code'}</p>
        </div>
      </div>
      {highlight ? (
        <code
          className={highlight.language ? `language-${highlight.language}` : ''}
        >
          {highlight.nodes.map((node, index) => (
            <span
              key={`${keyPrefix}-${index}`}
              className={node.classes.join(' ')}
            >
              {node.text}
            </span>
          ))}
        </code>
      ) : (
        <code>{code}</code>
      )}
    </pre>
  );
};
