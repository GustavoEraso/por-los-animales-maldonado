'use client';

import { SPONSOR_HIGHLIGHT_OPTIONS } from '@/lib/sponsorColors';
import { SponsorHighlightTone } from '@/types';

interface SponsorColorPickerProps {
  /** Visible label for the picker. */
  label: string;
  /** Stored background tone. */
  value?: SponsorHighlightTone;
  /** Legacy cream flag used to preselect cream when no tone is stored. */
  legacyHighlight?: boolean;
  /** Called with the selected tone. */
  onChange: (tone: SponsorHighlightTone) => void;
}

/**
 * Compact palette picker for section, group and text backgrounds.
 *
 * @param props - Current tone and change callback
 * @returns The color picker UI
 */
export default function SponsorColorPicker({
  label,
  value,
  legacyHighlight,
  onChange,
}: SponsorColorPickerProps): React.ReactElement {
  const selectedTone = value ?? (legacyHighlight ? 'cream' : 'none');

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {SPONSOR_HIGHLIGHT_OPTIONS.map((option) => {
          const isSelected = selectedTone === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              title={option.label}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'border-green-forest bg-green-forest/10 text-green-dark'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full border border-gray-200 ${option.swatchClass}`}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
