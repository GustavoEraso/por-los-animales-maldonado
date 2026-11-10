'use client';

import { CopyIcon, TrashIcon } from '@/components/Icons';
import { SponsorBlock, SponsorLeafBlock } from '@/types';
import SponsorBlocksEditor from './SponsorBlocksEditor';
import SponsorColorPicker from './SponsorColorPicker';
import SponsorLinkField from './SponsorLinkField';
import {
  MAX_BUTTON_LABEL_LENGTH,
  MAX_SECTION_BADGE_LENGTH,
  MAX_SECTION_DESCRIPTION_LENGTH,
  MAX_SECTION_TITLE_LENGTH,
} from './sponsorSections';

interface SponsorBlockEditorProps {
  /** Block being edited. */
  block: SponsorBlock;
  /** Called with the updated block. */
  onChange: (block: SponsorBlock) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDuplicate: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** One-based section number used in labels and error messages. */
  sectionNumber: number;
  /** Remaining leaf blocks allowed in the whole section. */
  remainingBlocks: number;
  /** Remaining button blocks allowed in the whole section. */
  remainingButtons: number;
}

const BLOCK_LABELS: Record<SponsorBlock['type'], string> = {
  title: 'Título',
  badge: 'Etiqueta destacada',
  description: 'Texto',
  button: 'Botón',
  group: 'Grupo',
};

/**
 * Editor for a single content block inside a sponsor card section.
 *
 * Only renders the fields relevant to the block type. Blocks can be reordered
 * or removed from the header controls.
 *
 * @param props - Block, position controls and change callback
 * @returns The block editor UI
 */
export default function SponsorBlockEditor({
  block,
  onChange,
  canMoveUp,
  canMoveDown,
  canDuplicate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  sectionNumber,
  remainingBlocks,
  remainingButtons,
}: SponsorBlockEditorProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-semibold text-green-dark">{BLOCK_LABELS[block.type]}</h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
            aria-label={`Mover ${BLOCK_LABELS[block.type]} hacia arriba`}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
            aria-label={`Mover ${BLOCK_LABELS[block.type]} hacia abajo`}
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canDuplicate}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label={`Duplicar ${BLOCK_LABELS[block.type]}`}
            title="Duplicar"
          >
            <CopyIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
            aria-label={`Eliminar ${BLOCK_LABELS[block.type]}`}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {block.type === 'title' && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`block-title-${block.id}`}
            className="text-xs font-semibold text-gray-700"
          >
            Texto del título
          </label>
          <input
            id={`block-title-${block.id}`}
            type="text"
            value={block.text}
            maxLength={MAX_SECTION_TITLE_LENGTH}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            aria-describedby={`block-title-count-${block.id}`}
            placeholder="Ej: Cómo ayudar"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
          />
          <p id={`block-title-count-${block.id}`} className="text-xs text-gray-400 text-right">
            {block.text.length}/{MAX_SECTION_TITLE_LENGTH} caracteres
          </p>
        </div>
      )}

      {block.type === 'badge' && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`block-badge-${block.id}`}
            className="text-xs font-semibold text-gray-700"
          >
            Texto de la etiqueta
          </label>
          <input
            id={`block-badge-${block.id}`}
            type="text"
            value={block.text}
            maxLength={MAX_SECTION_BADGE_LENGTH}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            aria-describedby={`block-badge-count-${block.id}`}
            placeholder="Ej: 1 COMPRA = 1KG DE COMIDA"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
          />
          <p id={`block-badge-count-${block.id}`} className="text-xs text-gray-400 text-right">
            {block.text.length}/{MAX_SECTION_BADGE_LENGTH} caracteres
          </p>
          <SponsorColorPicker
            label="Fondo de la etiqueta"
            value={block.highlightTone ?? 'forest'}
            onChange={(tone) => onChange({ ...block, highlightTone: tone })}
          />
          <p className="text-xs text-gray-500">Se muestra como una píldora con el color elegido.</p>
        </div>
      )}

      {block.type === 'description' && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`block-description-${block.id}`}
            className="text-xs font-semibold text-gray-700"
          >
            Texto
          </label>
          <textarea
            id={`block-description-${block.id}`}
            value={block.text}
            maxLength={MAX_SECTION_DESCRIPTION_LENGTH}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            aria-describedby={`block-description-count-${block.id}`}
            placeholder="Ej: Dona $100 por cada traslado solidario."
            rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-green-forest"
          />
          <p
            id={`block-description-count-${block.id}`}
            className="text-xs text-gray-400 text-right"
          >
            {block.text.length}/{MAX_SECTION_DESCRIPTION_LENGTH} caracteres
          </p>
          <SponsorColorPicker
            label="Fondo del texto"
            value={block.highlightTone}
            legacyHighlight={block.highlight}
            onChange={(tone) => onChange({ ...block, highlightTone: tone })}
          />
        </div>
      )}

      {block.type === 'button' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`block-button-label-${block.id}`}
              className="text-xs font-semibold text-gray-700"
            >
              Texto del botón
            </label>
            <input
              id={`block-button-label-${block.id}`}
              type="text"
              value={block.label}
              maxLength={MAX_BUTTON_LABEL_LENGTH}
              onChange={(event) => onChange({ ...block, label: event.target.value })}
              aria-describedby={`block-button-label-count-${block.id}`}
              placeholder="Ej: Quiero donar"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
            />
            <p
              id={`block-button-label-count-${block.id}`}
              className="text-xs text-gray-400 text-right"
            >
              {block.label.length}/{MAX_BUTTON_LABEL_LENGTH} caracteres
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`block-button-variant-${block.id}`}
              className="text-xs font-semibold text-gray-700"
            >
              Estilo
            </label>
            <select
              id={`block-button-variant-${block.id}`}
              value={block.variant ?? 'primary'}
              onChange={(event) =>
                onChange({
                  ...block,
                  variant: event.target.value === 'secondary' ? 'secondary' : 'primary',
                })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-forest"
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secundario</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <SponsorLinkField
              idPrefix={`block-button-link-${block.id}`}
              label="Link del botón"
              href={block.href}
              linkType={block.linkType}
              whatsappNumber={block.whatsappNumber}
              onChange={(values) => onChange({ ...block, ...values })}
            />
          </div>
        </div>
      )}

      {block.type === 'group' && (
        <div className="flex flex-col gap-3">
          <SponsorColorPicker
            label="Fondo del grupo"
            value={block.highlightTone}
            legacyHighlight={block.highlight}
            onChange={(tone) => onChange({ ...block, highlightTone: tone })}
          />

          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
            <SponsorBlocksEditor
              blocks={block.blocks}
              onChange={(nextBlocks) =>
                onChange({
                  ...block,
                  blocks: nextBlocks.filter(
                    (child): child is SponsorLeafBlock => child.type !== 'group'
                  ),
                })
              }
              allowGroups={false}
              sectionNumber={sectionNumber}
              remainingBlocks={remainingBlocks}
              remainingButtons={remainingButtons}
              emptyMessage="Este grupo no tiene elementos. Agregá el primero abajo."
            />
          </div>
        </div>
      )}
    </div>
  );
}
