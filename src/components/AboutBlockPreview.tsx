import ReactMarkdown from 'react-markdown';
import type { AboutBlock } from '../types/suggestion';

interface AboutBlockPreviewProps {
  blocks: AboutBlock[];
}

export function AboutBlockPreview({ blocks }: AboutBlockPreviewProps) {
  if (!blocks.length) {
    return (
      <p className="text-gray-400 text-sm italic">No content yet. Add text or image blocks.</p>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === 'text') {
          if (!block.content.trim()) return null;
          return (
            <div
              key={block.id}
              className="prose prose-invert max-w-none prose-sm prose-headings:text-white prose-p:text-gray-200"
            >
              <ReactMarkdown>{block.content}</ReactMarkdown>
            </div>
          );
        }
        if (!block.url) return null;
        return (
          <figure key={block.id} className="my-4">
            <img
              src={block.url}
              alt={block.alt || ''}
              className="w-full rounded"
            />
            {block.alt ? (
              <figcaption className="text-xs text-gray-500 mt-1 text-center">
                {block.alt}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
