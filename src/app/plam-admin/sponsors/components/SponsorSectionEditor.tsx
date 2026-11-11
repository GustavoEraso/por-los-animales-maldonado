'use client';

import { CopyIcon, TrashIcon } from '@/components/Icons';
import { countSponsorSectionBlocks, countSponsorSectionButtons } from '@/lib/sponsorCard';
import { SponsorSection } from '@/types';
import SponsorBlocksEditor from './SponsorBlocksEditor';
import SponsorColorPicker from './SponsorColorPicker';
import { MAX_BLOCKS_PER_SECTION, MAX_BUTTON_BLOCKS_PER_SECTION } from './sponsorSections';

interface SponsorSectionEditorProps {
  /** Section being edited. */
  section: SponsorSection;
  /** One-based section number used in labels and error messages. */
  sectionNumber: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDuplicate: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onChange: (section: SponsorSection) => void;
}

/**
 * Editor for a single sponsor card section.
 *
 * Renders the section header and the ordered list of content blocks.
 *
 * @param props - Section, position controls and change callback
 * @returns The section editor UI
 */
export default function SponsorSectionEditor({
  section,
  sectionNumber,
  canMoveUp,
  canMoveDown,
  canDuplicate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onChange,
}: SponsorSectionEditorProps): React.ReactElement {
  const remainingBlocks = MAX_BLOCKS_PER_SECTION - countSponsorSectionBlocks(section);
  const remainingButtons = MAX_BUTTON_BLOCKS_PER_SECTION - countSponsorSectionButtons(section);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-green-dark">Sección {sectionNumber}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
            aria-label={`Mover sección ${sectionNumber} hacia arriba`}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
            aria-label={`Mover sección ${sectionNumber} hacia abajo`}
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canDuplicate}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label={`Duplicar sección ${sectionNumber}`}
            title="Duplicar sección"
          >
            <CopyIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
            aria-label={`Eliminar sección ${sectionNumber}`}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      <SponsorColorPicker
        label="Fondo de la sección"
        value={section.highlightTone}
        legacyHighlight={section.highlight}
        onChange={(tone) => onChange({ ...section, highlightTone: tone })}
      />

      <SponsorBlocksEditor
        blocks={section.blocks ?? []}
        onChange={(blocks) => onChange({ ...section, blocks })}
        allowGroups={true}
        sectionNumber={sectionNumber}
        remainingBlocks={remainingBlocks}
        remainingButtons={remainingButtons}
        emptyMessage="Esta sección no tiene elementos. Agregá el primero abajo."
      />
    </section>
  );
}
