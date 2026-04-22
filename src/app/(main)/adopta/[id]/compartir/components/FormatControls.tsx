interface FormatPresetItem {
  key: string;
  label: string;
}

interface FormatControlsProps {
  formatPresets: FormatPresetItem[];
  selectedFormatKey: string;
  onSelectFormat: (key: string) => void;
}

/**
 * Renders the format selector for share poster presets.
 *
 * @example
 * <FormatControls
 *   formatPresets={formatPresets}
 *   selectedFormatKey={selectedFormat.key}
 *   onSelectFormat={handleSelectFormat}
 * />
 */
export default function FormatControls({
  formatPresets,
  selectedFormatKey,
  onSelectFormat,
}: FormatControlsProps) {
  return (
    <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
      <div className="space-y-3">
        <h3 className="leading-none font-semibold text-2xl">Formato</h3>
        {formatPresets.map((format) => (
          <div
            key={format.key}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedFormatKey === format.key
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
            onClick={() => onSelectFormat(format.key)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{format.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
