import { FilePlus, LayoutGrid, FileInput } from 'lucide-react';
import type { Suggestion } from '../types/suggestion';

interface CapsuleToolbarProps {
  currentSuggestion: Suggestion;
  ownsCurrentCapsule: boolean;
  onStartBlank: () => void;
  onStartFromTemplate: (source: Suggestion) => void;
  onBrowseLibrary: () => void;
}

export function CapsuleToolbar({
  currentSuggestion,
  ownsCurrentCapsule,
  onStartBlank,
  onStartFromTemplate,
  onBrowseLibrary,
}: CapsuleToolbarProps) {
  if (ownsCurrentCapsule) {
    return (
      <div className="mb-4 space-y-2">
        <p className="text-xs text-gray-500">
          Editing your draft — use <span className="text-gray-400">Edit</span> on each
          section or click text to change it. Save when you want to keep progress.
        </p>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartBlank}
          className="flex items-center gap-1.5 text-xs bg-[#32404e] hover:bg-[#434e5b] px-3 py-2 rounded"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Start blank
        </button>
        <button
          type="button"
          onClick={onBrowseLibrary}
          className="flex items-center gap-1.5 text-xs bg-[#32404e] hover:bg-[#434e5b] px-3 py-2 rounded"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Browse capsules
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#202d39] rounded-lg p-3 mb-4 border border-gray-700/80">
      <p className="text-sm text-gray-300 mb-3">
        Viewing <span className="text-white font-medium">{currentSuggestion.username}</span>
        &apos;s capsule — preview only.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartBlank}
          className="flex items-center gap-1.5 text-xs bg-[#5c7e10] hover:bg-[#739c16] px-3 py-2 rounded"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Start blank
        </button>
        <button
          type="button"
          onClick={() => onStartFromTemplate(currentSuggestion)}
          className="flex items-center gap-1.5 text-xs bg-[#5c7e10] hover:bg-[#739c16] px-3 py-2 rounded"
        >
          <FileInput className="w-3.5 h-3.5" />
          Start from this template
        </button>
        <button
          type="button"
          onClick={onBrowseLibrary}
          className="flex items-center gap-1.5 text-xs bg-[#32404e] hover:bg-[#434e5b] px-3 py-2 rounded"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Browse capsules
        </button>
      </div>
    </div>
  );
}
