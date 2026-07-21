import { Animal } from '@/types';

interface CompatibilityFieldsProps {
  animal: Animal;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleCompatibilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Form fields for animal compatibility (dogs, cats, kids) and sterilization status.
 */
export default function CompatibilityFields({
  animal,
  handleChange,
  handleCompatibilityChange,
}: CompatibilityFieldsProps): React.ReactElement {
  return (
    <>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">Compatibilidad (sociable)</h3>
        <label className="flex gap-2 font-bold items-center ml-6">
          <span>Perros:</span>
          <select
            className="outline-2 bg-white outline-gray-200 rounded p-2"
            name="dogs"
            value={animal.compatibility?.dogs || 'no_se'}
            onChange={(e) => handleCompatibilityChange(e)}
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No sé</option>
          </select>
        </label>
        <label className="flex gap-2 font-bold items-center ml-6">
          <span>Gatos:</span>
          <select
            className="outline-2 bg-white outline-gray-200 rounded p-2"
            name="cats"
            value={animal.compatibility?.cats || 'no_se'}
            onChange={(e) => handleCompatibilityChange(e)}
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No sé</option>
          </select>
        </label>
        <label className="flex gap-2 font-bold items-center ml-6">
          <span>Niños:</span>
          <select
            className="outline-2 bg-white outline-gray-200 rounded p-2"
            name="kids"
            value={animal.compatibility?.kids || 'no_se'}
            onChange={(e) => handleCompatibilityChange(e)}
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No sé</option>
          </select>
        </label>
      </div>

      <label className="flex gap-2 font-bold items-center ml-6">
        <span>¿Está Castrado?</span>
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          name="isSterilized"
          value={animal.isSterilized || 'no_se'}
          onChange={(e) => handleChange(e)}
        >
          <option value="si">Sí</option>
          <option value="no">No</option>
          <option value="no_se">No sé</option>
        </select>
      </label>
    </>
  );
}
