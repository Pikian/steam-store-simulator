import { useMemo, useState } from 'react';
import {
  Star,
  Trash2,
  Share2,
  Copy,
  Search,
  ChevronDown,
  FileInput,
} from 'lucide-react';
import type { Suggestion } from '../types/suggestion';

export type CapsuleFilter = 'all' | 'mine' | 'team';
export type CapsuleSort = 'updated' | 'title';

interface CapsuleLibraryProps {
  suggestions: Suggestion[];
  currentId?: string;
  currentUsername?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  onShare: (suggestion: Suggestion) => void;
  onDuplicate: (suggestion: Suggestion) => void;
  onStartFrom: (suggestion: Suggestion) => void;
  onDelete: (id: string) => void;
  onStartBlank?: () => void;
  onSetDefault?: (id: string) => void;
  deletingId: string | null;
  isAdmin?: boolean;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function thumbnailUrl(s: Suggestion): string | null {
  if (s.header_image) return s.header_image;
  if (s.screenshots?.length) return s.screenshots[0];
  return null;
}

export function CapsuleLibrary({
  suggestions,
  currentId,
  currentUsername,
  searchQuery,
  onSearchChange,
  onSelect,
  onShare,
  onDuplicate,
  onStartFrom,
  onDelete,
  onStartBlank,
  onSetDefault,
  deletingId,
  isAdmin = false,
}: CapsuleLibraryProps) {
  const [filter, setFilter] = useState<CapsuleFilter>('all');
  const [sort, setSort] = useState<CapsuleSort>('updated');

  const filtered = useMemo(() => {
    let list = [...suggestions];

    if (filter === 'mine' && currentUsername) {
      list = list.filter((s) => s.username === currentUsername);
    } else if (filter === 'team' && currentUsername) {
      list = list.filter((s) => s.username !== currentUsername);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.short_description?.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    return list;
  }, [suggestions, filter, sort, searchQuery, currentUsername]);

  return (
    <div id="capsule-library" className="bg-[#202d39] rounded-lg p-4 mt-6 scroll-mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold">Game Capsules</h2>
        <span className="text-gray-400 text-sm">
          {filtered.length} of {suggestions.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, author, tags…"
            className="w-full bg-[#32404e] pl-8 pr-3 py-1.5 rounded text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'mine' as const, label: 'Mine' },
              { id: 'team' as const, label: 'Team' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded text-xs ${
                filter === f.id
                  ? 'bg-[#67c1f5]/30 text-[#67c1f5]'
                  : 'bg-[#32404e] text-gray-300 hover:bg-[#434e5b]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CapsuleSort)}
            className="appearance-none bg-[#32404e] pl-3 pr-8 py-1.5 rounded text-xs text-gray-200"
          >
            <option value="updated">Recently updated</option>
            <option value="title">Title A–Z</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm space-y-3">
            <p>No saved capsules yet.</p>
            {onStartBlank && (
              <button
                type="button"
                onClick={onStartBlank}
                className="bg-[#5c7e10] hover:bg-[#739c16] px-4 py-2 rounded text-sm text-white"
              >
                Start blank
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No capsules match your search.</p>
        ) : (
          filtered.map((suggestion) => {
            const thumb = thumbnailUrl(suggestion);
            return (
              <div
                key={suggestion.id}
                onClick={() => onSelect(suggestion)}
                className={`border border-gray-700 rounded p-3 hover:bg-[#32404e] cursor-pointer group flex gap-3 ${
                  currentId === suggestion.id ? 'bg-[#32404e] ring-1 ring-[#67c1f5]/40' : ''
                }`}
              >
                <div className="w-24 h-14 shrink-0 rounded overflow-hidden bg-[#1b2838]">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{suggestion.title}</h3>
                    {suggestion.is_default && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{suggestion.short_description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>by {suggestion.username}</span>
                    {formatDate(suggestion.updated_at || suggestion.created_at) && (
                      <>
                        <span>·</span>
                        <span>{formatDate(suggestion.updated_at || suggestion.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onStartFrom(suggestion)}
                    className="p-1.5 text-gray-500 hover:text-[#67c1f5]"
                    title="Start from this template"
                  >
                    <FileInput className="w-4 h-4" />
                  </button>
                  {suggestion.id && (
                    <button
                      type="button"
                      onClick={() => onShare(suggestion)}
                      className="p-1.5 text-gray-500 hover:text-[#67c1f5]"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDuplicate(suggestion)}
                    className="p-1.5 text-gray-500 hover:text-white"
                    title="Duplicate in library"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {isAdmin && onSetDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefault(suggestion.id!)}
                      disabled={suggestion.is_default}
                      className={`p-1.5 ${
                        suggestion.is_default
                          ? 'text-blue-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-300'
                      }`}
                      title="Set as default template"
                    >
                      <Star
                        className={`w-4 h-4 ${suggestion.is_default ? 'fill-current' : ''}`}
                      />
                    </button>
                  )}
                  {(currentUsername === suggestion.username || isAdmin) && suggestion.id && (
                    <button
                      type="button"
                      onClick={() => onDelete(suggestion.id!)}
                      disabled={deletingId === suggestion.id}
                      className="p-1.5 text-gray-500 hover:text-red-500 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
