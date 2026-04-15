import { Img } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { FIELD_ERROR_MESSAGES, LitterMember } from '../constants';

interface LitterMembersSectionProps {
  litterName: string;
  litterMembers: LitterMember[];
  formErrors: { litterName: boolean; litterMembers: boolean };
  onLitterNameChange: (name: string) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onUpdateMember: (index: number, field: keyof LitterMember, value: string) => void;
  onMemberImagesAdd: (index: number, images: Img[]) => void;
  onMemberImageDelete: (memberIndex: number, imgId: string) => void;
}

/**
 * Section for managing litter members. Each member has name, gender, and individual images.
 * Requires a litter name and at least 2 members.
 */
export default function LitterMembersSection({
  litterName,
  litterMembers,
  formErrors,
  onLitterNameChange,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onMemberImagesAdd,
  onMemberImageDelete,
}: LitterMembersSectionProps): React.ReactElement {
  return (
    <section className="flex flex-col gap-4 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
      <h3 className="text-lg font-bold text-center">Datos de la Camada</h3>

      <label className="flex flex-col font-bold gap-1">
        Nombre de la camada:
        {formErrors.litterName && (
          <div className="bg-red-500 text-white text-sm rounded px-2">
            {FIELD_ERROR_MESSAGES.litterName}
          </div>
        )}
        <input
          className="outline-2 bg-white outline-gray-200 rounded p-2"
          type="text"
          value={litterName}
          onChange={(e) => onLitterNameChange(e.target.value)}
          placeholder='Ej: "Camada del parque", "Los de la ruta 5"'
        />
      </label>

      {formErrors.litterMembers && (
        <div className="bg-red-500 text-white text-sm rounded px-2">
          {FIELD_ERROR_MESSAGES.litterMembers}
        </div>
      )}

      {litterMembers.map((member, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 bg-white p-3 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-green-dark">Animal #{index + 1}</h4>
            {litterMembers.length > 2 && (
              <button
                type="button"
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                onClick={() => onRemoveMember(index)}
              >
                Eliminar
              </button>
            )}
          </div>

          <label className="flex flex-col font-bold gap-1">
            Nombre:
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="text"
              value={member.name}
              onChange={(e) => onUpdateMember(index, 'name', e.target.value)}
              placeholder="Nombre del cachorro"
            />
          </label>

          <label className="flex flex-col font-bold">
            Género:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              value={member.gender}
              onChange={(e) => onUpdateMember(index, 'gender', e.target.value)}
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-bold">Fotos:</span>
            <div className="flex flex-wrap gap-2 items-center">
              {member.images.map((img) => (
                <div key={img.imgId} className="relative flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onMemberImageDelete(index, img.imgId)}
                    className="bg-white rounded-full w-6 h-6 absolute top-1 right-1 shadow text-xs font-bold"
                  >
                    X
                  </button>
                  <img
                    src={img.imgUrl}
                    alt={img.imgAlt}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
              ))}
            </div>
            {member.images.length < 5 && (
              <UploadImages
                onImagesAdd={(newImages) => onMemberImagesAdd(index, newImages)}
                maxFiles={5 - member.images.length}
              />
            )}
          </div>
        </div>
      ))}

      {litterMembers.length < 12 && (
        <button
          type="button"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-fit self-center"
          onClick={onAddMember}
        >
          + Agregar animal a la camada
        </button>
      )}
    </section>
  );
}
