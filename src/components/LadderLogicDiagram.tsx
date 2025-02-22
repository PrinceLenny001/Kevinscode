"use client";

import { useCallback, useState, useRef } from 'react';
import { ACDElement, ACDElementType, ACDLadderLogic, ACDRung } from '@/lib/types/acd';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ElementProps {
  element: ACDElement;
  id: string;
}

const LadderElement = ({ element, id }: ElementProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-center w-16 h-16 border rounded-lg ${
        isDragging ? 'opacity-50' : ''
      } ${
        element.type.startsWith('XIC') || element.type.startsWith('XIO')
          ? 'bg-blue-100'
          : element.type.startsWith('OT')
          ? 'bg-green-100'
          : 'bg-gray-100'
      }`}
    >
      <div className="text-center">
        <div className="font-bold text-sm">{element.type}</div>
        <div className="text-xs">{element.tag}</div>
      </div>
    </div>
  );
};

interface RungProps {
  rung: ACDRung;
  onElementsReorder: (rungIndex: number, items: string[]) => void;
  rungIndex: number;
}

const LadderRung = ({ rung, onElementsReorder, rungIndex }: RungProps) => {
  const items = rung.elements.map((element, index) => 
    `${rungIndex}-${element.type}-${element.tag}-${index}`
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
        <div className="w-8 text-center text-sm font-bold">{rung.number}</div>
        <div className="flex-1 flex items-center gap-2">
          <SortableContext items={items} strategy={horizontalListSortingStrategy}>
            {rung.elements.map((element, index) => {
              const id = `${rungIndex}-${element.type}-${element.tag}-${index}`;
              return <LadderElement key={id} element={element} id={id} />;
            })}
          </SortableContext>
        </div>
      </div>
      {rung.comment && (
        <div className="text-sm text-gray-500 italic pl-10">{rung.comment}</div>
      )}
    </div>
  );
};

interface LadderLogicDiagramProps {
  value: ACDLadderLogic;
  onChange?: (value: ACDLadderLogic) => void;
}

export const LadderLogicDiagram = ({ value, onChange }: LadderLogicDiagramProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const [activeRungIndex] = activeId.split('-');
    const [overRungIndex] = overId.split('-');

    if (activeRungIndex === overRungIndex && onChange) {
      const rungIndex = parseInt(activeRungIndex);
      const rung = value.rungs[rungIndex];
      const oldIndex = rung.elements.findIndex((_, i) => 
        activeId === `${rungIndex}-${rung.elements[i].type}-${rung.elements[i].tag}-${i}`
      );
      const newIndex = rung.elements.findIndex((_, i) => 
        overId === `${rungIndex}-${rung.elements[i].type}-${rung.elements[i].tag}-${i}`
      );

      const newRungs = value.rungs.map((r, i) => {
        if (i !== rungIndex) return r;

        const newElements = arrayMove(r.elements, oldIndex, newIndex);
        newElements.forEach((element, index) => {
          element.position.col = index;
        });

        return {
          ...r,
          elements: newElements,
        };
      });

      onChange({ rungs: newRungs });
    }
  }, [value, onChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 p-4 bg-gray-50 border rounded-lg">
        {value.rungs.map((rung, index) => (
          <LadderRung
            key={rung.number}
            rung={rung}
            onElementsReorder={(rungIndex, items) => {
              // This is handled in handleDragEnd now
            }}
            rungIndex={index}
          />
        ))}
      </div>
    </DndContext>
  );
}; 