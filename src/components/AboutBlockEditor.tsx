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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Type, Image as ImageIcon } from 'lucide-react';
import type { AboutBlock } from '../types/suggestion';
import { createImageBlock, createTextBlock } from '../lib/aboutBlocks';
import { AboutBlockPreview } from './AboutBlockPreview';

interface AboutBlockEditorProps {
  blocks: AboutBlock[];
  onChange: (blocks: AboutBlock[]) => void;
  onPickImage: (blockId: string) => void;
}

function SortableBlockRow({
  block,
  onUpdate,
  onDelete,
  onPickImage,
}: {
  block: AboutBlock;
  onUpdate: (block: AboutBlock) => void;
  onDelete: () => void;
  onPickImage: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#32404e] rounded-lg p-3 border border-gray-600/50"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {block.type === 'text' ? 'Text' : 'Image / GIF'}
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="text-gray-500 hover:text-red-400 p-1"
              aria-label="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {block.type === 'text' ? (
            <textarea
              value={block.content}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              className="w-full bg-[#1b2838] p-2 rounded text-sm min-h-[100px] resize-y"
              placeholder="Markdown supported: headings, lists, **bold**, etc."
              rows={5}
            />
          ) : (
            <div className="space-y-2">
              {block.url ? (
                <img
                  src={block.url}
                  alt={block.alt || ''}
                  className="w-full rounded max-h-48 object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-[#1b2838] rounded flex items-center justify-center text-gray-500 text-sm">
                  No image selected
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onPickImage}
                  className="text-xs bg-[#5c7e10] hover:bg-[#739c16] px-3 py-1.5 rounded"
                >
                  {block.url ? 'Change image' : 'Choose from library'}
                </button>
              </div>
              <input
                type="text"
                value={block.alt || ''}
                onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
                className="w-full bg-[#1b2838] p-2 rounded text-xs"
                placeholder="Caption (optional)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AboutBlockEditor({
  blocks,
  onChange,
  onPickImage,
}: AboutBlockEditorProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const updateBlock = (id: string, updated: AboutBlock) => {
    onChange(blocks.map((b) => (b.id === id ? updated : b)));
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...blocks, createTextBlock()])}
          className="flex items-center gap-1.5 text-xs bg-[#32404e] hover:bg-[#434e5b] px-3 py-1.5 rounded"
        >
          <Type className="w-3.5 h-3.5" />
          Text block
        </button>
        <button
          type="button"
          onClick={() => {
            const block = createImageBlock('');
            onChange([...blocks, block]);
            onPickImage(block.id);
          }}
          className="flex items-center gap-1.5 text-xs bg-[#32404e] hover:bg-[#434e5b] px-3 py-1.5 rounded"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Image / GIF
        </button>
      </div>

      {blocks.length > 0 ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blocks.map((block) => (
                <SortableBlockRow
                  key={block.id}
                  block={block}
                  onUpdate={(updated) => updateBlock(block.id, updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onPickImage={() => onPickImage(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-gray-400 text-sm">Add blocks to build your About section.</p>
      )}

      <div className="border-t border-gray-600 pt-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
        <AboutBlockPreview blocks={blocks} />
      </div>
    </div>
  );
}
