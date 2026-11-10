'use client';

import { Fragment, useState } from 'react';
import { countSponsorBlockItems } from '@/lib/sponsorCard';
import { SponsorBlock } from '@/types';
import SponsorBlockEditor from './SponsorBlockEditor';
import {
  createBadgeBlock,
  createButtonBlock,
  createDescriptionBlock,
  createGroupBlock,
  createTitleBlock,
  duplicateSponsorBlock,
} from './sponsorSections';

interface SponsorBlocksEditorProps {
  /** Ordered blocks to edit. */
  blocks: SponsorBlock[];
  /** Called with the next block list after every change. */
  onChange: (blocks: SponsorBlock[]) => void;
  /** Allows adding group blocks. Disabled inside groups to keep one nesting level. */
  allowGroups: boolean;
  /** One-based section number used in labels and error messages. */
  sectionNumber: number;
  /** Remaining leaf blocks allowed in the whole section. */
  remainingBlocks: number;
  /** Remaining button blocks allowed in the whole section. */
  remainingButtons: number;
  /** Message shown when the block list is empty. */
  emptyMessage: string;
}

/**
 * Ordered block list with controls to add, remove and reorder elements.
 *
 * @param props - Blocks, limits and change callback
 * @returns The block editor UI
 */
export default function SponsorBlocksEditor({
  blocks,
  onChange,
  allowGroups,
  sectionNumber,
  remainingBlocks,
  remainingButtons,
  emptyMessage,
}: SponsorBlocksEditorProps): React.ReactElement {
  const [openInsertIndex, setOpenInsertIndex] = useState<number | null>(null);

  const updateBlock = (blockId: string, updatedBlock: SponsorBlock): void => {
    onChange(blocks.map((block) => (block.id === blockId ? updatedBlock : block)));
  };

  const removeBlock = (blockId: string): void => {
    setOpenInsertIndex(null);
    onChange(blocks.filter((block) => block.id !== blockId));
  };

  const moveBlock = (index: number, direction: 'up' | 'down'): void => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    setOpenInsertIndex(null);
    const nextBlocks = [...blocks];
    [nextBlocks[index], nextBlocks[targetIndex]] = [nextBlocks[targetIndex], nextBlocks[index]];
    onChange(nextBlocks);
  };

  const canDuplicateBlock = (block: SponsorBlock): boolean => {
    if (countSponsorBlockItems(block) > remainingBlocks) return false;
    if (block.type === 'button' && remainingButtons <= 0) return false;
    if (block.type === 'group') {
      const buttonCount = block.blocks.filter((child) => child.type === 'button').length;
      if (buttonCount > remainingButtons) return false;
    }
    return true;
  };

  const duplicateBlock = (index: number): void => {
    const block = blocks[index];
    if (!canDuplicateBlock(block)) return;

    setOpenInsertIndex(null);
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, duplicateSponsorBlock(block));
    onChange(nextBlocks);
  };

  const insertBlock = (index: number, block: SponsorBlock): void => {
    if (remainingBlocks <= 0) return;

    const nextBlocks = [...blocks];
    nextBlocks.splice(index, 0, block);
    onChange(nextBlocks);
    setOpenInsertIndex(null);
  };

  const addBlock = (block: SponsorBlock): void => {
    if (remainingBlocks <= 0) return;
    setOpenInsertIndex(null);
    onChange([...blocks, block]);
  };

  const canAddBlock = remainingBlocks > 0;
  const canAddButton = remainingBlocks > 0 && remainingButtons > 0;
  const canAddGroup = allowGroups && remainingBlocks > 0;

  return (
    <div className="flex flex-col gap-3">
      {openInsertIndex !== null && (
        <button
          type="button"
          tabIndex={-1}
          className="fixed inset-0 z-10 cursor-default"
          aria-label="Cerrar menú de agregar elemento"
          onClick={() => setOpenInsertIndex(null)}
        />
      )}

      {blocks.length === 0 ? (
        <p className="text-xs text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 p-3 text-center">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blocks.map((block, index) => (
            <Fragment key={block.id}>
              <li>
                <SponsorBlockEditor
                  block={block}
                  onChange={(updatedBlock) => updateBlock(block.id, updatedBlock)}
                  onMoveUp={() => moveBlock(index, 'up')}
                  onMoveDown={() => moveBlock(index, 'down')}
                  onDuplicate={() => duplicateBlock(index)}
                  onRemove={() => removeBlock(block.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                  canDuplicate={canDuplicateBlock(block)}
                  sectionNumber={sectionNumber}
                  remainingBlocks={remainingBlocks}
                  remainingButtons={remainingButtons}
                />
              </li>

              {index < blocks.length - 1 && (
                <li className="relative flex justify-center -my-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenInsertIndex(openInsertIndex === index + 1 ? null : index + 1)
                    }
                    disabled={!canAddBlock}
                    title="Agregar elemento aquí"
                    aria-label="Agregar elemento aquí"
                    aria-expanded={openInsertIndex === index + 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-green-forest bg-white text-base font-bold leading-none text-green-forest shadow-sm transition-colors hover:bg-green-forest hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>

                  {openInsertIndex === index + 1 && (
                    <div className="absolute left-1/2 top-8 z-20 flex -translate-x-1/2 flex-col gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => insertBlock(index + 1, createTitleBlock())}
                        disabled={!canAddBlock}
                        className="whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Título
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBlock(index + 1, createBadgeBlock())}
                        disabled={!canAddBlock}
                        className="whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Etiqueta
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBlock(index + 1, createDescriptionBlock())}
                        disabled={!canAddBlock}
                        className="whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Texto
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBlock(index + 1, createButtonBlock())}
                        disabled={!canAddButton}
                        className="whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Botón
                      </button>
                      {allowGroups && (
                        <button
                          type="button"
                          onClick={() => insertBlock(index + 1, createGroupBlock())}
                          disabled={!canAddGroup}
                          className="whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Grupo
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Agregar</span>
        <button
          type="button"
          onClick={() => addBlock(createTitleBlock())}
          disabled={!canAddBlock}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Título
        </button>
        <button
          type="button"
          onClick={() => addBlock(createBadgeBlock())}
          disabled={!canAddBlock}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Etiqueta
        </button>
        <button
          type="button"
          onClick={() => addBlock(createDescriptionBlock())}
          disabled={!canAddBlock}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Texto
        </button>
        <button
          type="button"
          onClick={() => addBlock(createButtonBlock())}
          disabled={!canAddButton}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Botón
        </button>
        {allowGroups && (
          <button
            type="button"
            onClick={() => addBlock(createGroupBlock())}
            disabled={!canAddGroup}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Grupo
          </button>
        )}
      </div>

      {!canAddBlock && (
        <p className="text-xs text-amber-600">Máximo de elementos alcanzado para esta sección.</p>
      )}
    </div>
  );
}
