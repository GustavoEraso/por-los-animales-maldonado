interface ColorSchemeItem {
  name: string;
  primary: `#${string}`;
  secondary: `#${string}`;
  accent: `#${string}`;
}

interface ColorSchemeControlsProps {
  colorSchemes: ColorSchemeItem[];
  selectedColorSchemeName: string;
  onSelectColorScheme: (name: string) => void;
}

/**
 * Renders the available color palettes for the share poster.
 *
 * @example
 * <ColorSchemeControls
 *   colorSchemes={colorSchemes}
 *   selectedColorSchemeName={selectedColorScheme.name}
 *   onSelectColorScheme={handleSelectColorScheme}
 * />
 */
export default function ColorSchemeControls({
  colorSchemes,
  selectedColorSchemeName,
  onSelectColorScheme,
}: ColorSchemeControlsProps) {
  return (
    <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
      <div className="space-y-3">
        <h3 className="leading-none font-semibold text-2xl">Selector de colores</h3>
        {colorSchemes.map((scheme) => (
          <div
            key={scheme.name}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedColorSchemeName === scheme.name
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
            onClick={() => onSelectColorScheme(scheme.name)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{scheme.name}</span>
              <div className="flex gap-1">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: scheme.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: scheme.secondary }}
                />
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: scheme.accent }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
