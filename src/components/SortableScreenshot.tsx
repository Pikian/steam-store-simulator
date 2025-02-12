import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Film, Image } from 'lucide-react';

interface SortableScreenshotProps {
  id: string;
  url: string;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableScreenshot({
  id,
  url,
  isSelected,
  isEditing,
  onSelect,
  onDelete
}: SortableScreenshotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVideo = url.match(/\.(mp4|webm)$/i);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      {isVideo ? (
        <div className="w-full aspect-video bg-black">
          <video
            src={url}
            className="w-full h-full object-contain"
            muted
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <Film className="absolute top-2 right-2 w-4 h-4 text-white bg-black/50 p-1 rounded" />
        </div>
      ) : (
        <>
          <img
            src={url}
            alt="Screenshot"
            className="w-full aspect-video object-cover rounded"
          />
          <Image className="absolute top-2 right-2 w-4 h-4 text-white bg-black/50 p-1 rounded" />
        </>
      )}
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-between p-1 bg-black/0 hover:bg-black/30 transition-colors">
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}