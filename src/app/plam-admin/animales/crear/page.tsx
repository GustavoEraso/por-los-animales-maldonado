'use client';

import Loader from '@/components/Loader';
import { PlusIcon } from '@/components/Icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCreateAnimal } from './hooks/useCreateAnimal';
import BasicInfoFields from './components/BasicInfoFields';
import CompatibilityFields from './components/CompatibilityFields';
import DateStatusFields from './components/DateStatusFields';
import PrivateInfoFields from './components/PrivateInfoFields';
import ImagesSection from './components/ImagesSection';
import CreationModeSelect from './components/CreationModeSelect';
import LitterMembersSection from './components/LitterMembersSection';
import ParentSelectionSection from '@/components/ParentSelectionSection';
import { Suspense } from 'react';
import { FIELD_ERROR_MESSAGES } from './constants';

export default function CreateAnimalForm(): React.ReactElement {
  return (
    <Suspense>
      <CreateAnimalFormContent />
    </Suspense>
  );
}

function CreateAnimalFormContent(): React.ReactElement {
  const {
    loading,
    animal,
    setAnimal,
    privateInfo,
    setPrivateInfo,
    setTransaction,
    images,
    setImages,
    contacts,
    setContacts,
    isAvailable,
    setIsAvailable,
    isVisible,
    setIsVisible,
    formErrors,
    creationMode,
    setCreationMode,
    litterName,
    setLitterName,
    litterMembers,
    addLitterMember,
    removeLitterMember,
    updateLitterMember,
    handleLitterMemberImagesAdd,
    handleLitterMemberImageDelete,
    motherId,
    setMotherId,
    fatherId,
    setFatherId,
    isAddingSibling,
    handleChange,
    handleCompatibilityChange,
    handleBirthDateChange,
    handlePrivateInfoChange,
    handleSubmit,
    handleImageDelete,
    formatMillisForInputDate,
  } = useCreateAnimal();

  const isLitter = creationMode === 'litter';

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <h1 className="text-4xl font-bold">
          {isAddingSibling ? 'Agregar hermano a camada' : 'Crear Animal'}
        </h1>
        <p>
          {isAddingSibling
            ? 'Agrega un nuevo animal a una camada existente.'
            : 'Aquí puedes crear un nuevo animal para la base de datos.'}
        </p>
        <form
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          autoComplete="off"
          className="flex flex-col gap-4 max-w-xl w-full"
        >
          {!isAddingSibling && (
            <CreationModeSelect creationMode={creationMode} onModeChange={setCreationMode} />
          )}

          {isLitter && (
            <LitterMembersSection
              litterName={litterName}
              litterMembers={litterMembers}
              formErrors={{
                litterName: formErrors.litterName,
                litterMembers: formErrors.litterMembers,
              }}
              onLitterNameChange={setLitterName}
              onAddMember={addLitterMember}
              onRemoveMember={removeLitterMember}
              onUpdateMember={updateLitterMember}
              onMemberImagesAdd={handleLitterMemberImagesAdd}
              onMemberImageDelete={handleLitterMemberImageDelete}
            />
          )}

          <BasicInfoFields
            animal={animal}
            formErrors={formErrors}
            handleChange={handleChange}
            isLitter={isLitter}
          />

          <CompatibilityFields
            animal={animal}
            handleChange={handleChange}
            handleCompatibilityChange={handleCompatibilityChange}
          />

          <DateStatusFields
            animal={animal}
            privateInfo={privateInfo}
            formErrors={formErrors}
            isAvailable={isAvailable}
            isVisible={isVisible}
            setIsAvailable={setIsAvailable}
            setIsVisible={setIsVisible}
            handleChange={handleChange}
            handleBirthDateChange={handleBirthDateChange}
            handlePrivateInfoChange={handlePrivateInfoChange}
            setAnimal={setAnimal}
            formatMillisForInputDate={formatMillisForInputDate}
          />

          {animal.status && (
            <PrivateInfoFields
              privateInfo={privateInfo}
              formErrors={formErrors}
              contacts={contacts}
              setContacts={setContacts}
              setPrivateInfo={setPrivateInfo}
              setTransaction={setTransaction}
              handlePrivateInfoChange={handlePrivateInfoChange}
              formatMillisForInputDate={formatMillisForInputDate}
            />
          )}

          <ImagesSection
            images={images}
            setImages={setImages}
            formErrors={formErrors}
            handleImageDelete={handleImageDelete}
            isLitter={isLitter}
          />

          <ParentSelectionSection
            motherId={motherId}
            fatherId={fatherId}
            onMotherSelect={setMotherId}
            onFatherSelect={setFatherId}
          />

          {Object.values(formErrors).some(Boolean) && (
            <div className="bg-red-500 text-white p-3 rounded">
              <p>Faltan Datos:</p>
              <ul className="list-disc ml-5">
                {formErrors.litterName && <li>{FIELD_ERROR_MESSAGES.litterName}</li>}
                {formErrors.litterMembers && <li>{FIELD_ERROR_MESSAGES.litterMembers}</li>}
                {formErrors.name && <li>{FIELD_ERROR_MESSAGES.name}</li>}
                {formErrors.description && <li>{FIELD_ERROR_MESSAGES.description}</li>}
                {formErrors.images && <li>{FIELD_ERROR_MESSAGES.images}</li>}
                {formErrors.rescueReason && <li>{FIELD_ERROR_MESSAGES.rescueReason}</li>}
                {formErrors.contactName && <li>{FIELD_ERROR_MESSAGES.contactName}</li>}
                {formErrors.contacts && <li>{FIELD_ERROR_MESSAGES.contacts}</li>}
              </ul>
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <PlusIcon size={20} title="Crear animal" color="white" />
            Guardar animal
          </button>
        </form>
        {loading && <Loader />}
      </section>
    </ProtectedRoute>
  );
}
