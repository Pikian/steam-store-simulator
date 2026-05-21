import type { AboutBlock, Suggestion } from '../types/suggestion';

export function createBlockId(): string {
  return crypto.randomUUID();
}

export function createTextBlock(content = ''): AboutBlock {
  return { id: createBlockId(), type: 'text', content };
}

export function createImageBlock(url: string, alt = ''): AboutBlock {
  return { id: createBlockId(), type: 'image', url, alt };
}

/** Migrate legacy long_description into about_blocks when blocks are empty. */
export function normalizeAboutBlocks(suggestion: Suggestion): AboutBlock[] {
  const blocks = suggestion.about_blocks;
  if (blocks && blocks.length > 0) {
    return blocks;
  }
  const md = suggestion.long_description?.trim();
  if (md) {
    return [{ id: createBlockId(), type: 'text', content: md }];
  }
  return [];
}

/** Serialize blocks back to long_description for backward compatibility. */
export function blocksToLongDescription(blocks: AboutBlock[]): string {
  return blocks
    .filter((b): b is AboutBlock & { type: 'text' } => b.type === 'text')
    .map((b) => b.content)
    .join('\n\n');
}

export function prepareSuggestionForSave(suggestion: Suggestion): Omit<Suggestion, 'id'> {
  const about_blocks = normalizeAboutBlocks(suggestion);
  const long_description = blocksToLongDescription(about_blocks);
  const { id: _id, ...rest } = suggestion;
  return {
    ...rest,
    about_blocks,
    long_description,
    short_description: suggestion.short_description || '',
    header_image: suggestion.header_image || '',
    screenshots: suggestion.screenshots || [],
    tags: suggestion.tags || [],
    price: suggestion.price || 0,
  };
}

export function normalizeSuggestionFromDb(raw: Suggestion): Suggestion {
  const about_blocks = normalizeAboutBlocks(raw);
  return {
    ...raw,
    about_blocks,
    long_description: blocksToLongDescription(about_blocks) || raw.long_description || '',
  };
}
