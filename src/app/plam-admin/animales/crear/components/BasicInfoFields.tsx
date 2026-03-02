import { Animal } from '@/types';
import { FIELD_ERROR_MESSAGES, FormErrors } from '../constants';

interface BasicInfoFieldsProps {
  animal: Animal;
  formErrors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
}

/**
 * Form fields for basic animal information: name, description, gender, species,
 * life stage, and size.
 */
export default function BasicInfoFields({
  animal,
  formErrors,
  handleChange,
}: BasicInfoFieldsProps): React.ReactElement {
  return (
    <>
      <label className="flex flex-col font-bold gap-1">
        Nombre:
        {formErrors.name && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.name}
          </div>
        )}
        <input
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          type="text"
          name="name"
          value={animal.name}
          onChange={handleChange}
          required
        />
      </label>

      <label className="flex flex-col font-bold gap-1">
        Descripción:
        {formErrors.description && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.description}
          </div>
        )}
        <textarea
          className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
          name="description"
          value={animal.description}
          onChange={handleChange}
        />
      </label>

      <label className="flex flex-col font-bold">
        Género:
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          name="gender"
          value={animal.gender}
          onChange={handleChange}
        >
          <option value="macho">Macho</option>
          <option value="hembra">Hembra</option>
        </select>
      </label>

      <label className="flex flex-col font-bold">
        Especie:
        <select
          className="outline-2  bg-white outline-gray-200 rounded p-2"
          name="species"
          value={animal.species}
          onChange={handleChange}
        >
          <option value="perro">Perro</option>
          <option value="gato">Gato</option>
          <option value="otros">Otros</option>
        </select>
      </label>

      <label className="flex flex-col font-bold">
        Etapa de vida (edad):
        <select
          className="outline-2  bg-white outline-gray-200 rounded p-2"
          name="lifeStage"
          value={animal.lifeStage}
          onChange={handleChange}
        >
          <option value="cachorro">Cachorro</option>
          <option value="joven">Joven</option>
          <option value="adulto">Adulto</option>
        </select>
      </label>

      <label className="flex flex-col font-bold">
        Tamaño:
        <select
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          name="size"
          value={animal.size}
          onChange={handleChange}
        >
          <option value="pequeño">Pequeño</option>
          <option value="mediano">Mediano</option>
          <option value="grande">Grande</option>
          <option value="no_se_sabe">No sé sabe</option>
        </select>
      </label>
    </>
  );
}
