'use client';

import { Fragment } from 'react';
import { TrashIcon } from '@/components/Icons';
import { SponsorButton, SponsorSection } from '@/types';
import SponsorLinkField from './SponsorLinkField';
import {
  MAX_BUTTONS_PER_SECTION,
  MAX_BUTTON_LABEL_LENGTH,
  MAX_SECTION_BADGE_LENGTH,
  MAX_SECTION_DESCRIPTION_LENGTH,
  MAX_SECTION_TITLE_LENGTH,
  MAX_SPONSOR_SECTIONS,
  createButtonId,
  createEmptySection,
} from './sponsorSections';

interface SponsorSectionsEditorProps {
  /** Sections currently being edited. */
  sections: SponsorSection[];
  /** Called with the next sections array after every change. */
  onChange: (sections: SponsorSection[]) => void;
}

/**
 * Editor for the additional content sections of a sponsor card.
 *
 * Allows admins to add, remove and reorder sections, and to manage each
 * section's title, description, highlight state and buttons without changing
 * the card's visual identity.
 *
 * @param props - Current sections and change callback
 * @returns The sections editor UI
 */
export default function SponsorSectionsEditor({
  sections,
  onChange,
}: SponsorSectionsEditorProps): React.ReactElement {
  const updateSection = (sectionId: string, updates: Partial<SponsorSection>): void => {
    onChange(
      sections.map((section) => (section.id === sectionId ? { ...section, ...updates } : section))
    );
  };

  const updateButton = (
    sectionId: string,
    buttonId: string,
    updates: Partial<SponsorButton>
  ): void => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          buttons: (section.buttons ?? []).map((button) =>
            button.id === buttonId ? { ...button, ...updates } : button
          ),
        };
      })
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

  const addButton = (sectionId: string): void => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    const buttons = section.buttons ?? [];
    if (buttons.length >= MAX_BUTTONS_PER_SECTION) return;

    updateSection(sectionId, {
      buttons: [...buttons, { id: createButtonId(), label: '', href: '', variant: 'primary' }],
    });
  };

  const removeButton = (sectionId: string, buttonId: string): void => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      buttons: (section.buttons ?? []).filter((button) => button.id !== buttonId),
    });
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
          Armá el contenido con títulos, descripciones y botones.
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 text-center">
          La tarjeta no tiene contenido. Agregá una sección para sumar títulos, descripciones o
          botones.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sections.map((section, index) => {
            const buttons = section.buttons ?? [];

            return (
              <Fragment key={section.id}>
                <li className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-green-dark">Sección {index + 1}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                        aria-label={`Mover sección ${index + 1} hacia arriba`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                        aria-label={`Mover sección ${index + 1} hacia abajo`}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
                        aria-label={`Eliminar sección ${index + 1}`}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label
                        htmlFor={`section-title-${section.id}`}
                        className="text-sm font-semibold text-gray-700"
                      >
                        Título (opcional)
                      </label>
                      <input
                        id={`section-title-${section.id}`}
                        type="text"
                        value={section.title ?? ''}
                        maxLength={MAX_SECTION_TITLE_LENGTH}
                        onChange={(event) =>
                          updateSection(section.id, { title: event.target.value })
                        }
                        placeholder="Ej: Beneficios exclusivos"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-forest"
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label
                        htmlFor={`section-badge-${section.id}`}
                        className="text-sm font-semibold text-gray-700"
                      >
                        Etiqueta destacada (opcional)
                      </label>
                      <input
                        id={`section-badge-${section.id}`}
                        type="text"
                        value={section.badge ?? ''}
                        maxLength={MAX_SECTION_BADGE_LENGTH}
                        onChange={(event) =>
                          updateSection(section.id, { badge: event.target.value })
                        }
                        placeholder="Ej: 1 COMPRA = 1KG DE COMIDA"
                        aria-describedby={`section-badge-count-${section.id}`}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-forest"
                      />
                      <p
                        id={`section-badge-count-${section.id}`}
                        className="text-xs text-gray-400 text-right"
                      >
                        {(section.badge ?? '').length}/{MAX_SECTION_BADGE_LENGTH} caracteres
                      </p>
                      <p className="text-xs text-gray-500">
                        Se muestra como una píldora verde en la tarjeta.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label
                        htmlFor={`section-description-${section.id}`}
                        className="text-sm font-semibold text-gray-700"
                      >
                        Descripción (opcional)
                      </label>
                      <textarea
                        id={`section-description-${section.id}`}
                        value={section.description ?? ''}
                        maxLength={MAX_SECTION_DESCRIPTION_LENGTH}
                        onChange={(event) =>
                          updateSection(section.id, { description: event.target.value })
                        }
                        placeholder="Ej: Dona $100 por cada traslado solidario."
                        rows={3}
                        aria-describedby={`section-description-count-${section.id}`}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-green-forest"
                      />
                      <p
                        id={`section-description-count-${section.id}`}
                        className="text-xs text-gray-400 text-right"
                      >
                        {(section.description ?? '').length}/{MAX_SECTION_DESCRIPTION_LENGTH}{' '}
                        caracteres
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={section.highlight ?? false}
                        onChange={(event) =>
                          updateSection(section.id, { highlight: event.target.checked })
                        }
                        className="accent-green-forest w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">
                        Destacar descripción con fondo crema
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">
                        Botones{' '}
                        <span className="text-gray-400 font-normal">
                          ({buttons.length}/{MAX_BUTTONS_PER_SECTION})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => addButton(section.id)}
                        disabled={buttons.length >= MAX_BUTTONS_PER_SECTION}
                        className="px-3 py-1.5 rounded-lg bg-green-forest text-white text-xs font-semibold hover:bg-green-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        + Agregar botón
                      </button>
                    </div>

                    {buttons.length === 0 ? (
                      <p className="text-xs text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 p-3 text-center">
                        Sin botones. Podés agregar hasta {MAX_BUTTONS_PER_SECTION}.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {buttons.map((button, buttonIndex) => (
                          <li
                            key={button.id}
                            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-gray-500">
                                Botón {buttonIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeButton(section.id, button.id)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
                                aria-label={`Eliminar botón ${buttonIndex + 1} de la sección ${index + 1}`}
                              >
                                <TrashIcon size={12} />
                              </button>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                <label
                                  htmlFor={`button-label-${button.id}`}
                                  className="text-xs font-semibold text-gray-700"
                                >
                                  Texto del botón
                                </label>
                                <input
                                  id={`button-label-${button.id}`}
                                  type="text"
                                  value={button.label}
                                  maxLength={MAX_BUTTON_LABEL_LENGTH}
                                  onChange={(event) =>
                                    updateButton(section.id, button.id, {
                                      label: event.target.value,
                                    })
                                  }
                                  placeholder="Ej: Quiero donar"
                                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label
                                  htmlFor={`button-variant-${button.id}`}
                                  className="text-xs font-semibold text-gray-700"
                                >
                                  Estilo
                                </label>
                                <select
                                  id={`button-variant-${button.id}`}
                                  value={button.variant ?? 'primary'}
                                  onChange={(event) =>
                                    updateButton(section.id, button.id, {
                                      variant:
                                        event.target.value === 'secondary'
                                          ? 'secondary'
                                          : 'primary',
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
                                  idPrefix={`button-link-${button.id}`}
                                  label="Link del botón"
                                  href={button.href}
                                  linkType={button.linkType}
                                  whatsappNumber={button.whatsappNumber}
                                  onChange={(values) => updateButton(section.id, button.id, values)}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
            );
          })}
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
