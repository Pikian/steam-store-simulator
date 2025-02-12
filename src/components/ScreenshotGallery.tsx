import React from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Film, Image } from 'lucide-react';
import { SortableScreenshot } from './SortableScreenshot';

interface ScreenshotGalleryProps {
  screenshots: string[];
  selectedScreenshot: number;
  isEditing: boolean;
  onSelect: (index: number) => void;
  onReorder: (screenshots: string[]) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

export function ScreenshotGallery({
  screenshots,
  selectedScreenshot,
  isEditing,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
}: ScreenshotGalleryProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = screenshots.indexOf(active.id as string);
      const newIndex = screenshots.indexOf(over.id as string);
      
      onReorder(arrayMove(screenshots, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={screenshots} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-5 gap-1.5">
          {screenshots.map((screenshot, index) => (
            <SortableScreenshot
              key={screenshot}
              id={screenshot}
              url={screenshot}
              index={index}
              isSelected={selectedScreenshot === index}
              isEditing={isEditing}
              onSelect={() => onSelect(index)}
              onDelete={() => onDelete(index)}
            />
          ))}
          {isEditing && (
            <button
              onClick={onAdd}
              className="aspect-video flex flex-col items-center justify-center bg-[#32404e] hover:bg-[#434e5b] rounded transition-colors gap-1"
            >
              <Plus className="w-6 h-6" />
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Image className="w-3 h-3" />
                <span>/</span>
                <Film className="w-3 h-3" />
              </div>
            </button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}