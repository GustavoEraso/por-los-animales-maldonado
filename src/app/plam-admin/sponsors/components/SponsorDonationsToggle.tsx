'use client';

interface SponsorDonationsToggleProps {
  /** Whether the card is enabled for the donations page. */
  checked: boolean;
  /** Called when the toggle changes. */
  onChange: (checked: boolean) => void;
}

/**
 * Toggle that controls whether a sponsor card is shown on the donations page.
 *
 * @param props - Current value and change callback
 * @returns The visibility toggle UI
 */
export default function SponsorDonationsToggle({
  checked,
  onChange,
}: SponsorDonationsToggleProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3">
      <div>
        <label htmlFor="showInDonations" className="font-semibold cursor-pointer">
          Mostrar en Donaciones
        </label>
        <p className="text-xs text-gray-500 mt-0.5">
          Si está activado, la tarjeta aparece en la sección &quot;Mencionanos y Ayudanos&quot; de
          Donaciones. No afecta los carruseles de logos.
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          id="showInDonations"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only peer"
        />
        <div className="relative w-11 h-6 bg-gray-200 rounded-full transition-colors peer peer-checked:bg-green-forest peer-focus-visible:ring-2 peer-focus-visible:ring-green-forest after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
      </label>
    </div>
  );
}
