import { AnimalTransactionType, PrivateInfoType } from '@/types';
import { FIELD_ERROR_MESSAGES, FormErrors } from '../constants';
import { createTimestamp } from '@/lib/dateUtils';

interface PrivateInfoFieldsProps {
  privateInfo: PrivateInfoType;
  formErrors: FormErrors;
  contacts: { type: 'celular' | 'email' | 'other'; value: string | number }[];
  setContacts: React.Dispatch<
    React.SetStateAction<{ type: 'celular' | 'email' | 'other'; value: string | number }[]>
  >;
  setPrivateInfo: React.Dispatch<React.SetStateAction<PrivateInfoType>>;
  setTransaction: React.Dispatch<React.SetStateAction<AnimalTransactionType>>;
  handlePrivateInfoChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  formatMillisForInputDate: (millis: number) => string;
}

/**
 * Form fields for private animal information: case manager, contacts,
 * start date, vaccinations, medical conditions, and notes.
 */
export default function PrivateInfoFields({
  privateInfo,
  formErrors,
  contacts,
  setContacts,
  setPrivateInfo,
  setTransaction,
  handlePrivateInfoChange,
  formatMillisForInputDate,
}: PrivateInfoFieldsProps): React.ReactElement {
  return (
    <section className="flex flex-col gap-4 bg-gray-100 p-2 rounded-lg">
      <h3 className="font-semibold text-center">Datos privados del Animal</h3>
      <label className="flex flex-col font-bold gap-1">
        Responsable:
        <input
          className="outline-2  bg-white outline-gray-200 rounded p-2"
          type="text"
          name="caseManager"
          value={privateInfo.caseManager}
          onChange={handlePrivateInfoChange}
          required
        />
      </label>

      <label className="flex flex-col font-bold gap-1">
        Nombre del contacto (transitorio/adoptante):
        {formErrors.contactName && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.contactName}
          </div>
        )}
        <input
          className="outline-2  bg-white outline-gray-200 rounded p-2"
          type="text"
          name="contactName"
          onChange={handlePrivateInfoChange}
        />
      </label>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Contactos:</h2>
        {formErrors.contacts && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.contacts}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {contacts.map((contact, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                className="outline-2 bg-white outline-gray-200 rounded p-2"
                value={contact.type}
                onChange={(e) => {
                  const newContacts = [...contacts];
                  newContacts[index].type = e.target.value as 'celular' | 'email' | 'other';
                  setContacts(newContacts);
                }}
              >
                <option value="celular">Celular</option>
                <option value="email">Email</option>
                <option value="other">Otro</option>
              </select>
              <input
                className="outline-2 bg-white outline-gray-200 rounded p-2 flex-1"
                type="text"
                value={contact.value}
                onChange={(e) => {
                  const newContacts = [...contacts];
                  newContacts[index].value = e.target.value;
                  setContacts(newContacts);
                }}
                placeholder="Valor del contacto"
              />
              <button
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                onClick={(e) => {
                  e.preventDefault();
                  setContacts((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-fit"
          onClick={(e) => {
            e.preventDefault();
            setContacts((prev) => [...prev, { type: 'celular', value: '' }]);
          }}
        >
          + Agregar contacto
        </button>
      </section>

      <label className="flex flex-col font-bold">
        <span>Fecha de inicio:</span>
        <p className="font-normal text-xs text-balance">
          (Esta es la fecha en la que se tomo el caso){' '}
        </p>
        <input
          className="outline-2  bg-white outline-gray-200 rounded p-2"
          type="date"
          name="since"
          defaultValue={formatMillisForInputDate(createTimestamp())}
          onChange={(e) =>
            setTransaction((prev) => ({
              ...prev,
              since: e.target.value ? new Date(e.target.value).getTime() : 0,
            }))
          }
        />
      </label>

      <label>
        <span className="font-bold">Vacunas del animal:</span>
        {privateInfo.vaccinations && privateInfo.vaccinations.length > 0 ? (
          <ul className="list-disc list-inside">
            {privateInfo.vaccinations.map((vaccine, index) => (
              <li
                key={index}
                className="flex gap-1 p-1 rounded justify-between items-center bg-amber-50"
              >
                <span>
                  {new Date(vaccine.date).toLocaleDateString('es-UY', { timeZone: 'UTC' })} -{' '}
                  {vaccine.vaccine}
                </span>
                <button
                  className="bg-red-500 text-white px-2 rounded"
                  onClick={(e) => {
                    e.preventDefault();
                    const updatedVaccinations =
                      privateInfo.vaccinations?.filter((_, i) => i !== index) || [];
                    setPrivateInfo((prev) => ({
                      ...prev,
                      vaccinations: updatedVaccinations,
                    }));
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No se han registrado vacunas.</p>
        )}
      </label>

      <label>
        <span className="font-bold">Agregar Vacuna:</span>
        <div className="flex flex-col gap-2">
          <input
            className="outline-2  bg-white outline-gray-200 rounded p-2 w-full"
            type="text"
            name="vaccineName"
            placeholder="Ej: Antirrabica"
            id="vaccineName"
          />
          <div className="flex gap-2 sm:flex-row flex-col">
            <input
              className="outline-2  bg-white outline-gray-200 rounded p-2"
              type="date"
              name="vaccineDate"
              id="vaccineDate"
              defaultValue={formatMillisForInputDate(createTimestamp())}
            />
            <button
              className="bg-green-500 w-full text-white px-4 py-2 rounded"
              onClick={(e) => {
                e.preventDefault();
                const vaccineInput = document.getElementById('vaccineName') as HTMLInputElement;
                const dateInput = document.getElementById('vaccineDate') as HTMLInputElement;
                if (vaccineInput?.value && dateInput?.value) {
                  const newVaccine = {
                    vaccine: vaccineInput.value,
                    date: new Date(dateInput.value).getTime(),
                  };
                  setPrivateInfo((prev) => ({
                    ...prev,
                    vaccinations: prev.vaccinations
                      ? [...prev.vaccinations, newVaccine]
                      : [newVaccine],
                  }));
                  vaccineInput.value = '';
                  dateInput.value = '';
                }
              }}
            >
              Agregar registro
            </button>
          </div>
        </div>
      </label>

      <label className="flex flex-col font-bold">
        <span className="font-bold">Patologias del animal:</span>
        <textarea
          className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
          name="medicalConditions"
          onChange={handlePrivateInfoChange}
          placeholder='Ejemplo: "Diabetes, Epilepsia, si toma medicacion etc"'
          value={privateInfo.medicalConditions || ''}
        />
      </label>

      <label className="flex flex-col font-bold">
        <span>Información adicional:</span>
        <textarea
          className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
          name="notes"
          onChange={handlePrivateInfoChange}
          placeholder='Ejemplo: "tiene coordinada una visita al veterinario el 15/08"'
          value={privateInfo.notes || ''}
        />
      </label>
    </section>
  );
}
