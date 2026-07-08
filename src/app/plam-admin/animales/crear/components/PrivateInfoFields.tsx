import { useEffect, useState } from 'react';
import { AnimalTransactionType, PrivateInfoType, UserType } from '@/types';
import { FIELD_ERROR_MESSAGES, FormErrors } from '../constants';
import { createTimestamp } from '@/lib/dateUtils';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { logger } from '@/lib/logger';

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
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [showOtherCaseManager, setShowOtherCaseManager] = useState(
    !!privateInfo.caseManager &&
      !privateInfo.caseManager.includes('@')
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await getFirestoreData({
          currentCollection: 'authorizedEmails',
        });
        setUsers(data as UserType[]);
      } catch (error) {
        logger({ level: 'error', code: 'FETCH_USERS_ERROR', message: 'Error fetching users for case manager:', data: error });
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <section className="flex flex-col gap-4 bg-gray-100 p-2 rounded-lg">
      <h3 className="font-semibold text-center">Datos privados del Animal</h3>
      <label className="flex flex-col font-bold gap-1">
        Responsable:
        {usersLoading ? (
          <p className="text-xs text-gray-400 py-1 font-normal">Cargando...</p>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUsersOpen(!usersOpen)}
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg text-left flex items-center justify-between font-normal"
            >
              <span>
                {privateInfo.caseManager
                  ? users.find((u) => u.id === privateInfo.caseManager)?.name ??
                    privateInfo.caseManager
                  : 'Seleccionar responsable'}
              </span>
              <span className="text-xs text-gray-400 ml-2">{usersOpen ? '▲' : '▼'}</span>
            </button>
            {usersOpen && (
              <div className="absolute z-10 w-full mt-1 border-2 border-green-dark bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {users
                  .filter((u) => u.role !== 'user')
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setPrivateInfo((prev) => ({ ...prev, caseManager: user.id }));
                        setShowOtherCaseManager(false);
                        setUsersOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 transition-colors border ${
                        privateInfo.caseManager === user.id
                          ? 'bg-green-100 border-green-300'
                          : 'border-transparent hover:bg-green-50'
                      }`}
                    >
                      <span className="block text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="block text-xs text-gray-500">{user.id}</span>
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => {
                    setPrivateInfo((prev) => ({ ...prev, caseManager: '' }));
                    setShowOtherCaseManager(true);
                    setUsersOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors border ${
                    showOtherCaseManager
                      ? 'bg-green-100 border-green-300'
                      : 'border-transparent hover:bg-green-50'
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900">Otro</span>
                  <span className="block text-xs text-gray-500">Escribir nombre manualmente</span>
                </button>
              </div>
            )}
          </div>
        )}
        {showOtherCaseManager && (
          <>
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2 font-normal mt-1"
              type="text"
              placeholder="Nombre del responsable"
              value={privateInfo.caseManager || ''}
              onChange={(e) =>
                setPrivateInfo((prev) => ({ ...prev, caseManager: e.target.value }))
              }
              required
            />
            <p className="text-xs text-amber-700 mt-1 font-normal">
              Conviene seleccionar de la lista.
            </p>
          </>
        )}
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
