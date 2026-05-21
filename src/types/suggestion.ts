export type AboutBlock =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; alt?: string };

export interface Suggestion {
  id?: string;
  title: string;
  short_description: string;
  long_description: string;
  about_blocks?: AboutBlock[];
  header_image: string;
  screenshots: string[];
  tags: string[];
  price: number;
  username: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Minimal empty capsule — use for "Start blank". */
export const blankSuggestionTemplate: Suggestion = {
  title: 'Untitled capsule',
  short_description: '',
  long_description: '',
  about_blocks: [
    {
      id: 'blank-about-1',
      type: 'text',
      content: '# About This Game\n\n',
    },
  ],
  header_image: '',
  screenshots: [],
  tags: [],
  price: 0,
  username: '',
};

/** Rich starter content for demos / first-time UX. */
export const defaultSuggestionTemplate: Suggestion = {
  title: 'Your Game Title',
  short_description: 'A brief description of your game',
  long_description: '# About This Game\n\nDescribe your game here. You can use markdown for formatting.\n\n## Key Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Additional Info\n\nAdd more details about your game...',
  about_blocks: [
    {
      id: 'default-text-1',
      type: 'text',
      content:
        '# About This Game\n\nDescribe your game here. You can use markdown for formatting.\n\n## Key Features\n\n- Feature 1\n- Feature 2\n- Feature 3',
    },
  ],
  header_image: '',
  screenshots: [],
  tags: ['Action', 'Adventure', 'Indie'],
  price: 19.99,
  username: '',
};

export function createBlankCapsule(username: string): Suggestion {
  return {
    ...blankSuggestionTemplate,
    username,
    about_blocks: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        content: '# About This Game\n\n',
      },
    ],
  };
}

/** Fork any capsule into an unsaved draft owned by the current user. */
export function forkCapsule(source: Suggestion, username: string, titleSuffix = ''): Suggestion {
  const baseTitle = source.title.replace(/\s*\((Copy|draft)\)\s*$/i, '').trim();
  const blocks =
    source.about_blocks && source.about_blocks.length > 0
      ? source.about_blocks
      : source.long_description?.trim()
        ? [{ id: crypto.randomUUID(), type: 'text' as const, content: source.long_description }]
        : [{ id: crypto.randomUUID(), type: 'text' as const, content: '# About This Game\n\n' }];
  return {
    ...source,
    id: undefined,
    is_default: undefined,
    username,
    title: titleSuffix ? `${baseTitle}${titleSuffix}` : `${baseTitle} (draft)`,
    about_blocks: blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
  };
}
