import { CreationMode } from '../constants';

interface CreationModeSelectProps {
  creationMode: CreationMode;
  onModeChange: (mode: CreationMode) => void;
}

/**
 * Select dropdown to choose between creating a single animal or a litter (camada).
 */
export default function CreationModeSelect({
  creationMode,
  onModeChange,
}: CreationModeSelectProps): React.ReactElement {
  return (
    <label className="flex flex-col font-bold gap-1">
      Tipo de registro:
      <select
        className="outline-2 bg-white outline-gray-200 rounded p-2"
        value={creationMode}
        onChange={(e) => onModeChange(e.target.value as CreationMode)}
      >
        <option value="single">Caso único</option>
        <option value="litter">Camada</option>
      </select>
    </label>
  );
}
