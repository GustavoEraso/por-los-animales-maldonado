'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Animal, Img, AnimalTransactionType, CompatibilityType, PrivateInfoType } from '@/types';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { generateAnimalId } from '@/lib/generateAnimalId';
import { generateLitterId } from '@/lib/generateLitterId';
import { auth } from '@/firebase';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { createTimestamp } from '@/lib/dateUtils';
import {
  INITIAL_ANIMAL,
  INITIAL_PRIVATE_INFO,
  INITIAL_TRANSACTION,
  INITIAL_LITTER_MEMBER,
  FIELD_ERROR_MESSAGES,
  FormErrors,
  CreationMode,
  LitterMember,
} from '../constants';

const MIN_LOADING_TIME = 600;

interface UseCreateAnimalReturn {
  loading: boolean;
  animal: Animal;
  setAnimal: React.Dispatch<React.SetStateAction<Animal>>;
  privateInfo: PrivateInfoType;
  setPrivateInfo: React.Dispatch<React.SetStateAction<PrivateInfoType>>;
  transaction: AnimalTransactionType;
  setTransaction: React.Dispatch<React.SetStateAction<AnimalTransactionType>>;
  images: Img[];
  setImages: React.Dispatch<React.SetStateAction<Img[]>>;
  contacts: { type: 'celular' | 'email' | 'other'; value: string | number }[];
  setContacts: React.Dispatch<
    React.SetStateAction<{ type: 'celular' | 'email' | 'other'; value: string | number }[]>
  >;
  isAvailable: boolean;
  setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  compatibility: CompatibilityType;
  formErrors: FormErrors;
  creationMode: CreationMode;
  setCreationMode: React.Dispatch<React.SetStateAction<CreationMode>>;
  litterName: string;
  setLitterName: React.Dispatch<React.SetStateAction<string>>;
  litterMembers: LitterMember[];
  addLitterMember: () => void;
  removeLitterMember: (index: number) => void;
  updateLitterMember: (index: number, field: keyof LitterMember, value: string) => void;
  handleLitterMemberImagesAdd: (memberIndex: number, newImages: Img[]) => void;
  handleLitterMemberImageDelete: (memberIndex: number, imgId: string) => Promise<void>;
  motherId: string;
  setMotherId: React.Dispatch<React.SetStateAction<string>>;
  fatherId: string;
  setFatherId: React.Dispatch<React.SetStateAction<string>>;
  isAddingSibling: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleCompatibilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleBirthDateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handlePrivateInfoChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleImageDelete: (imgId: string) => Promise<void>;
  formatMillisForInputDate: (millis: number) => string;
}

/**
 * Custom hook that manages all state and logic for the create animal form.
 * Handles form state, validation, submission, and image management.
 *
 * @returns Object with form state, handlers, and utility functions
 */
export function useCreateAnimal(): UseCreateAnimalReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [animal, setAnimal] = useState<Animal>(INITIAL_ANIMAL);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType>(INITIAL_PRIVATE_INFO);
  const [transaction, setTransaction] = useState<AnimalTransactionType>(INITIAL_TRANSACTION);
  const [images, setImages] = useState<Img[]>([]);
  const [contacts, setContacts] = useState<
    { type: 'celular' | 'email' | 'other'; value: string | number }[]
  >([{ type: 'celular', value: '' }]);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [compatibility, setCompatibility] = useState<CompatibilityType>({
    dogs: 'no_se',
    cats: 'no_se',
    kids: 'no_se',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: false,
    images: false,
    description: false,
    rescueReason: false,
    contactName: false,
    contacts: false,
    litterName: false,
    litterMembers: false,
  });

  // Litter-specific state
  const [creationMode, setCreationMode] = useState<CreationMode>('single');
  const [litterName, setLitterName] = useState('');
  const [litterMembers, setLitterMembers] = useState<LitterMember[]>([
    { ...INITIAL_LITTER_MEMBER },
    { ...INITIAL_LITTER_MEMBER, name: '' },
  ]);

  // Parent association state
  const [motherId, setMotherId] = useState('');
  const [fatherId, setFatherId] = useState('');

  // Check for "add sibling" query params
  const qpLitterId = searchParams.get('litterId') || '';
  const qpLitterName = searchParams.get('litterName') || '';
  const qpMotherId = searchParams.get('motherId') || '';
  const qpFatherId = searchParams.get('fatherId') || '';
  const isAddingSibling = qpLitterId !== '';

  // Initialize from query params on first render
  useEffect(() => {
    if (qpMotherId) setMotherId(qpMotherId);
    if (qpFatherId) setFatherId(qpFatherId);
  }, [qpMotherId, qpFatherId]);

  // Fetch the current user's name to set as case manager
  useEffect(() => {
    const getName = async (): Promise<void> => {
      const email = auth.currentUser?.email;
      if (!email) return;
      const data: { name: string } | null = await getFirestoreDocById({
        currentCollection: 'authorizedEmails',
        id: email,
      });

      if (!data) return;
      const { name } = data;
      setPrivateInfo((prev) => ({
        ...prev,
        caseManager: name || '',
      }));
    };
    getName();
  }, []);

  // Sync compatibility state to animal
  useEffect(() => {
    setAnimal((prev) => ({
      ...prev,
      compatibility: compatibility,
    }));
  }, [compatibility]);

  // Sync contacts state to private info
  useEffect(() => {
    setPrivateInfo((prev) => ({
      ...prev,
      contacts,
    }));
  }, [contacts]);

  /** Resets all form state to initial values */
  const resetForm = (): void => {
    setAnimal(INITIAL_ANIMAL);
    setPrivateInfo(INITIAL_PRIVATE_INFO);
    setTransaction(INITIAL_TRANSACTION);
    setImages([]);
    setContacts([{ type: 'celular', value: '' }]);
    setIsAvailable(true);
    setIsVisible(true);
    setCompatibility({ dogs: 'no_se', cats: 'no_se', kids: 'no_se' });
    setFormErrors({
      name: false,
      images: false,
      description: false,
      rescueReason: false,
      contactName: false,
      contacts: false,
      litterName: false,
      litterMembers: false,
    });
    setCreationMode('single');
    setLitterName('');
    setLitterMembers([{ ...INITIAL_LITTER_MEMBER }, { ...INITIAL_LITTER_MEMBER, name: '' }]);
    setMotherId('');
    setFatherId('');
  };

  /** Formats a timestamp in milliseconds to an HTML date input value (YYYY-MM-DD) */
  function formatMillisForInputDate(millis: number): string {
    const date = new Date(millis);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Handles changes to animal fields */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setAnimal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /** Handles changes to compatibility selects */
  const handleCompatibilityChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setCompatibility((prev) => ({
      ...prev,
      [name]: value as 'si' | 'no' | 'no_se',
    }));
  };

  /** Handles changes to the approximate birth date selector */
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const monthsToSubtract = Math.floor(Number(e.target.value));
    const fractionalPart = Number(e.target.value) % 1;
    const currentDate = new Date();

    currentDate.setMonth(currentDate.getMonth() - monthsToSubtract);

    const daysToSubtract = Math.round(fractionalPart * 30.44);
    currentDate.setDate(currentDate.getDate() - daysToSubtract);

    setAnimal((prev) => ({
      ...prev,
      aproxBirthDate: currentDate.getTime(),
    }));
  };

  /** Handles changes to private info fields */
  const handlePrivateInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setPrivateInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /** Adds a new member to the litter */
  const addLitterMember = (): void => {
    setLitterMembers((prev) => [...prev, { ...INITIAL_LITTER_MEMBER }]);
  };

  /** Removes a member from the litter by index */
  const removeLitterMember = (index: number): void => {
    setLitterMembers((prev) => prev.filter((_, i) => i !== index));
  };

  /** Updates a field of a specific litter member */
  const updateLitterMember = (index: number, field: keyof LitterMember, value: string): void => {
    setLitterMembers((prev) => {
      const updated = [...prev];
      if (field === 'gender') {
        updated[index] = { ...updated[index], gender: value as 'macho' | 'hembra' };
      } else if (field === 'name') {
        updated[index] = { ...updated[index], name: value };
      }
      return updated;
    });
  };

  /** Adds uploaded images to a specific litter member */
  const handleLitterMemberImagesAdd = (memberIndex: number, newImages: Img[]): void => {
    setLitterMembers((prev) => {
      const updated = [...prev];
      updated[memberIndex] = {
        ...updated[memberIndex],
        images: [...updated[memberIndex].images, ...newImages],
      };
      return updated;
    });
  };

  /** Deletes an image from a specific litter member */
  const handleLitterMemberImageDelete = async (
    memberIndex: number,
    imgId: string
  ): Promise<void> => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: { title: 'Eliminando imagen...', text: 'Por favor espera...' },
        success: { title: 'Imagen eliminada', text: 'La imagen fue eliminada exitosamente' },
        error: { title: 'Error', text: 'Hubo un error al eliminar la imagen' },
      },
    });
    setLitterMembers((prev) => {
      const updated = [...prev];
      updated[memberIndex] = {
        ...updated[memberIndex],
        images: updated[memberIndex].images.filter((img) => img.imgId !== imgId),
      };
      return updated;
    });
  };

  /** Validates and submits the form to create a new animal or litter */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const start = createTimestamp();
    try {
      setLoading(true);

      if (creationMode === 'litter') {
        await handleLitterSubmit(start);
      } else {
        await handleSingleSubmit(start);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setLoading(false);
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;

      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    }
  };

  /** Handles submission for a single animal (original flow) */
  const handleSingleSubmit = async (start: number): Promise<void> => {
    const id = await generateAnimalId(animal.name);

    const newAnimal: Animal = {
      ...animal,
      id: id,
      images: images,
      isAvailable: isAvailable,
      isVisible: isVisible,
      ...(motherId ? { motherId } : {}),
      ...(fatherId ? { fatherId } : {}),
      ...(isAddingSibling ? { litterId: qpLitterId, litterName: qpLitterName } : {}),
    };
    const newPrivateInfo: PrivateInfoType = {
      ...privateInfo,
      id: id,
      name: animal.name,
    };

    const newTransaction: AnimalTransactionType = {
      id: id,
      name: animal.name,
      img: images[0],
      transactionType: 'create',
      date: createTimestamp(),
      modifiedBy: auth.currentUser?.email || '',
      since: transaction.since,
      changes: {
        after: {
          name: animal.name,
          gender: animal.gender,
          species: animal.species,
          images: images,
          description: animal.description,
          lifeStage: animal.lifeStage,
          size: animal.size,
          compatibility: animal.compatibility,
          isSterilized: animal.isSterilized,
          aproxBirthDate: animal.aproxBirthDate,
          waitingSince: animal.waitingSince,
          status: animal.status,
          isAvailable: isAvailable,
          isVisible: isVisible,
          isDeleted: false,
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
          caseManager: privateInfo.caseManager,
          rescueReason: newPrivateInfo.rescueReason,
          vaccinations: privateInfo.vaccinations,
          medicalConditions: privateInfo.medicalConditions,
          notes: privateInfo.notes,
        },
      },
    };

    const errors: FormErrors = {
      name: newAnimal.name === '',
      images: !images.length,
      description: newAnimal.description === '',
      rescueReason: !newPrivateInfo.rescueReason || (newPrivateInfo.rescueReason as string) === '',
      contactName: newPrivateInfo.contactName === '',
      contacts:
        !newPrivateInfo?.contacts?.length || !newPrivateInfo.contacts.some((c) => c.value !== ''),
      litterName: false,
      litterMembers: false,
    };

    setFormErrors(errors);
    if (errors.name) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.name });
    }
    if (errors.description) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.description });
    }
    if (errors.rescueReason) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.rescueReason });
    }
    if (errors.contactName) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.contactName });
    }
    if (errors.contacts) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.contacts });
    }
    if (errors.images) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.images });
    }

    if (Object.values(errors).some(Boolean)) {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
      return;
    }

    const promises = Promise.all([
      postFirestoreData<Animal>({ data: newAnimal, currentCollection: 'animals', id }),
      postFirestoreData<PrivateInfoType>({
        data: newPrivateInfo,
        currentCollection: 'animalPrivateInfo',
        id,
      }),
      postTransactionData({
        data: newTransaction,
      }),
    ]);

    await handlePromiseToast(promises, {
      messages: {
        pending: {
          title: `Subiendo a ${animal.name}...`,
          text: `Por favor espera mientras creamos a ${animal.name}`,
        },
        success: {
          title: `${animal.name} creado`,
          text: `${animal.name} fue creado exitosamente`,
        },
        error: {
          title: `Hubo un error al crear a ${animal.name}`,
          text: `Hubo un error al crear a ${animal.name}`,
        },
      },
    });

    await revalidateCache('animals');
    resetForm();
    router.replace('/plam-admin/animales');
  };

  /** Handles submission for a litter (multiple animals sharing common data) */
  const handleLitterSubmit = async (start: number): Promise<void> => {
    const hasInvalidMembers =
      litterMembers.length < 2 || litterMembers.some((m) => m.name === '' || m.images.length === 0);

    const errors: FormErrors = {
      name: false,
      images: false,
      description: animal.description === '',
      rescueReason: !privateInfo.rescueReason || (privateInfo.rescueReason as string) === '',
      contactName: privateInfo.contactName === '',
      contacts: !privateInfo?.contacts?.length || !privateInfo.contacts.some((c) => c.value !== ''),
      litterName: litterName.trim() === '',
      litterMembers: hasInvalidMembers,
    };

    setFormErrors(errors);
    if (errors.litterName) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.litterName });
    }
    if (errors.litterMembers) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.litterMembers });
    }
    if (errors.description) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.description });
    }
    if (errors.rescueReason) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.rescueReason });
    }
    if (errors.contactName) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.contactName });
    }
    if (errors.contacts) {
      handleToast({ type: 'error', title: 'Ups!', text: FIELD_ERROR_MESSAGES.contacts });
    }

    if (Object.values(errors).some(Boolean)) {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
      return;
    }

    const litterId = await generateLitterId(litterName);

    // Generate IDs for all members in parallel
    const memberIds = await Promise.all(
      litterMembers.map((member) => generateAnimalId(member.name))
    );

    // Build all Firebase operations for the litter
    const allPromises: Promise<unknown>[] = [];

    for (let i = 0; i < litterMembers.length; i++) {
      const member = litterMembers[i];
      const id = memberIds[i];

      const newAnimal: Animal = {
        ...animal,
        id,
        name: member.name,
        gender: member.gender,
        images: member.images,
        isAvailable: isAvailable,
        isVisible: isVisible,
        litterId,
        litterName,
        ...(motherId ? { motherId } : {}),
        ...(fatherId ? { fatherId } : {}),
      };

      const newPrivateInfo: PrivateInfoType = {
        ...privateInfo,
        id,
        name: member.name,
      };

      const newTransaction: AnimalTransactionType = {
        id,
        name: member.name,
        img: member.images[0],
        transactionType: 'create',
        date: createTimestamp(),
        modifiedBy: auth.currentUser?.email || '',
        since: transaction.since,
        changes: {
          after: {
            name: member.name,
            gender: member.gender,
            species: animal.species,
            images: member.images,
            description: animal.description,
            lifeStage: animal.lifeStage,
            size: animal.size,
            compatibility: animal.compatibility,
            isSterilized: animal.isSterilized,
            aproxBirthDate: animal.aproxBirthDate,
            waitingSince: animal.waitingSince,
            status: animal.status,
            isAvailable: isAvailable,
            isVisible: isVisible,
            isDeleted: false,
            contactName: privateInfo.contactName,
            contacts: privateInfo.contacts,
            caseManager: privateInfo.caseManager,
            rescueReason: privateInfo.rescueReason,
            vaccinations: privateInfo.vaccinations,
            medicalConditions: privateInfo.medicalConditions,
            notes: privateInfo.notes,
          },
        },
      };

      allPromises.push(
        postFirestoreData<Animal>({ data: newAnimal, currentCollection: 'animals', id }),
        postFirestoreData<PrivateInfoType>({
          data: newPrivateInfo,
          currentCollection: 'animalPrivateInfo',
          id,
        }),
        postTransactionData({ data: newTransaction })
      );
    }

    await handlePromiseToast(Promise.all(allPromises), {
      messages: {
        pending: {
          title: `Creando camada "${litterName}"...`,
          text: `Subiendo ${litterMembers.length} animales, por favor espera`,
        },
        success: {
          title: `Camada "${litterName}" creada`,
          text: `Se crearon ${litterMembers.length} animales exitosamente`,
        },
        error: {
          title: `Error al crear la camada`,
          text: `Hubo un error al crear la camada "${litterName}"`,
        },
      },
    });

    await revalidateCache('animals');
    resetForm();
    router.replace('/plam-admin/animales');
  };

  /** Deletes an uploaded image from Cloudinary and removes it from state */
  const handleImageDelete = async (imgId: string): Promise<void> => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: { title: 'Eliminando imagen...', text: 'Por favor espera...' },
        success: { title: 'Imagen eliminada', text: 'La imagen fue eliminada exitosamente' },
        error: { title: 'Error', text: 'Hubo un error al eliminar la imagen' },
      },
    });
    const filteredImages = images.filter((img) => img.imgId !== imgId);
    setImages(filteredImages);
  };

  return {
    loading,
    animal,
    setAnimal,
    privateInfo,
    setPrivateInfo,
    transaction,
    setTransaction,
    images,
    setImages,
    contacts,
    setContacts,
    isAvailable,
    setIsAvailable,
    isVisible,
    setIsVisible,
    compatibility,
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
  };
}
