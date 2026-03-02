import { Animal, PrivateInfoType } from '@/types';
import { DATE_OPTIONS, FIELD_ERROR_MESSAGES, FormErrors } from '../constants';

interface DateStatusFieldsProps {
  animal: Animal;
  privateInfo: PrivateInfoType;
  formErrors: FormErrors;
  isAvailable: boolean;
  isVisible: boolean;
  setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleBirthDateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handlePrivateInfoChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  setAnimal: React.Dispatch<React.SetStateAction<Animal>>;
  formatMillisForInputDate: (millis: number) => string;
}

/**
 * Form fields for age, waiting since date, current status, rescue reason,
 * and availability/visibility toggles.
 */
export default function DateStatusFields({
  animal,
  privateInfo,
  formErrors,
  isAvailable,
  isVisible,
  setIsAvailable,
  setIsVisible,
  handleChange,
  handleBirthDateChange,
  handlePrivateInfoChange,
  setAnimal,
  formatMillisForInputDate,
}: DateStatusFieldsProps): React.ReactElement {
  return (
    <>
      <label className="flex flex-col font-bold">
        Edad:
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2 max-h-48 overflow-y-auto"
          name="aproxBirthDate"
          defaultValue={DATE_OPTIONS[0].value}
          size={1}
          onChange={(e) => handleBirthDateChange(e)}
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col font-bold">
        Esperando desde:
        <input
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          type="date"
          name="waitingSince"
          value={animal.waitingSince ? formatMillisForInputDate(animal.waitingSince) : ''}
          onChange={(e) =>
            setAnimal((prev) => ({
              ...prev,
              waitingSince: e.target.value ? new Date(e.target.value).getTime() : 0,
            }))
          }
        />
      </label>

      <label className="flex flex-col font-bold">
        Situación actual:
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          name="status"
          value={animal.status}
          onChange={(e) => {
            handleChange(e);
          }}
        >
          <option value="adoptado">Adoptado</option>
          <option value="calle">Calle</option>
          <option value="protectora">Protectora</option>
          <option value="transitorio">Transitorio</option>
        </select>
      </label>

      <label className="flex flex-col font-bold gap-1">
        Motivo del rescate:
        {formErrors.rescueReason && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.rescueReason}
          </div>
        )}
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          name="rescueReason"
          value={privateInfo.rescueReason || ''}
          onChange={handlePrivateInfoChange}
          required
        >
          <option value="">Seleccionar motivo</option>
          <option value="abandonment">Abandono</option>
          <option value="lost">Perdido</option>
          <option value="sterilization">Esterilización</option>
          <option value="illness">Enfermedad</option>
          <option value="abuse">Maltrato</option>
          <option value="hit_by_vehicle">Atropellado</option>
          <option value="other">Otro</option>
        </select>
      </label>

      <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
        <span>Disponible para adoptar:</span>
        <input
          type="checkbox"
          className="sr-only peer"
          defaultChecked={isAvailable}
          name="isAvailable"
          onChange={(e) => setIsAvailable(e.target.checked)}
        />
        <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
      </label>
      <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
        <span>Mostar:</span>
        <input
          type="checkbox"
          className="sr-only peer"
          defaultChecked={isVisible}
          name="isVisible"
          onChange={(e) => setIsVisible(e.target.checked)}
        />
        <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
      </label>
    </>
  );
}
