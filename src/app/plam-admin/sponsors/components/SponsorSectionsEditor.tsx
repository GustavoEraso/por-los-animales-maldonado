'use client';

import { Fragment } from 'react';
import { SponsorSection } from '@/types';
import SponsorSectionEditor from './SponsorSectionEditor';
import {
  MAX_SPONSOR_SECTIONS,
  createEmptySection,
  duplicateSponsorSection,
} from './sponsorSections';

interface SponsorSectionsEditorProps {
  /** Sections currently being edited. */
  sections: SponsorSection[];
  /** Called with the next sections array after every change. */
  onChange: (sections: SponsorSection[]) => void;
}

/**
 * Editor for the content sections of a sponsor card.
 *
 * Sections contain ordered blocks and can be added, removed or reordered.
 *
 * @param props - Current sections and change callback
 * @returns The sections editor UI
 */
export default function SponsorSectionsEditor({
  sections,
  onChange,
}: SponsorSectionsEditorProps): React.ReactElement {
  const updateSection = (updatedSection: SponsorSection): void => {
    onChange(
      sections.map((section) => (section.id === updatedSection.id ? updatedSection : section))
    );
  };

  const addSectionAt = (index: number): void => {
    if (sections.length >= MAX_SPONSOR_SECTIONS) return;
    const nextSections = [...sections];
    nextSections.splice(index, 0, createEmptySection());
    onChange(nextSections);
  };

  const addSection = (): void => {
    addSectionAt(sections.length);
  };

  const removeSection = (sectionId: string): void => {
    onChange(sections.filter((section) => section.id !== sectionId));
  };

  const moveSection = (index: number, direction: 'up' | 'down'): void => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const nextSections = [...sections];
    [nextSections[index], nextSections[targetIndex]] = [
      nextSections[targetIndex],
      nextSections[index],
    ];
    onChange(nextSections);
  };

  const duplicateSection = (index: number): void => {
    if (sections.length >= MAX_SPONSOR_SECTIONS) return;

    const nextSections = [...sections];
    nextSections.splice(index + 1, 0, duplicateSponsorSection(sections[index]));
    onChange(nextSections);
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-green-dark">
          Secciones de la tarjeta{' '}
          <span className="text-sm font-normal text-gray-400">
            ({sections.length}/{MAX_SPONSOR_SECTIONS})
          </span>
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Armá el contenido con los elementos que necesites, en el orden que quieras.
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 text-center">
          La tarjeta no tiene contenido. Agregá una sección para empezar.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              <li>
                <SponsorSectionEditor
                  section={section}
                  sectionNumber={index + 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < sections.length - 1}
                  canDuplicate={sections.length < MAX_SPONSOR_SECTIONS}
                  onMoveUp={() => moveSection(index, 'up')}
                  onMoveDown={() => moveSection(index, 'down')}
                  onDuplicate={() => duplicateSection(index)}
                  onRemove={() => removeSection(section.id)}
                  onChange={updateSection}
                />
              </li>

              {index < sections.length - 1 && (
                <li className="flex justify-center -my-2">
                  <button
                    type="button"
                    onClick={() => addSectionAt(index + 1)}
                    disabled={sections.length >= MAX_SPONSOR_SECTIONS}
                    title="Agregar sección aquí"
                    aria-label="Agregar sección aquí"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-green-forest bg-white text-lg font-bold leading-none text-green-forest shadow-sm transition-colors hover:bg-green-forest hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addSection}
        disabled={sections.length >= MAX_SPONSOR_SECTIONS}
        className="self-start px-3 py-2 rounded-lg bg-green-forest text-white text-sm font-semibold hover:bg-green-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Agregar sección
      </button>
    </section>
  );
}
