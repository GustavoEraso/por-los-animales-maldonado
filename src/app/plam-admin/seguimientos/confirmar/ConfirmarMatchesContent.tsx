'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { generateAnimalId } from '@/lib/generateAnimalId';
import { createTimestamp } from '@/lib/dateUtils';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { PetsIcon, PhoneIcon, EyeIcon } from '@/components/Icons';
import { Animal, PrivateInfoType, Img } from '@/types';
import { logger } from '@/lib/logger';

/** Firestore document shape for seguimientoMatches/current */
interface MatchesDoc {
  entries: MatchEntry[];
  updatedAt: number;
}

/** Single CSV match entry shape */
interface MatchEntry {
  csv_row: number;
  csv_data: {
    responsable: string;
    notas_plam: string;
    fecha_adopcion: string;
    edad_nacimiento: string;
    tipo_animal: string;
    responsable_adopcion: string;
    nombre_adoptante: string;
    telefonos: string;
    direccion: string;
    descripcion_mascota: string;
    nombre_actual: string;
    edad_actual: string;
    castrado: string;
    contacto_natalia: string;
    vacunas_al_dia: string;
    fecha_castracion: string;
    estado: string;
    notas_seguimiento: string;
    notas_natalia: string;
    foto_url: string;
    finalizacion: string;
  };
  match_level: string;
  primary_match_id: string | null;
  all_matched_ids: string[];
  match_reason: string;
  all_candidates: {
    level: string;
    confidence: number;
    ids: string[];
    reason: string;
  }[];
}

type FilterMatch = 'todos' | 'matched' | 'unmatched' | 'confirmados';

/** Fields that can be migrated from CSV to animalPrivateInfo */
interface MigrateField {
  key: string;
  label: string;
  currentValue: string;
  newValue: string;
  hasChanged: boolean;
}

/** A match entry that has been migrated, stored in seguimientoMatches/confirmed */
interface ConfirmedEntry extends MatchEntry {
  migratedAt: number;
  migratedTo: string;
  migratedFields: string[];
  animalImageUrl: string;
}

/** Form data for creating a basic animal from CSV data */
interface CreateFormData {
  name: string;
  species: 'perro' | 'gato' | 'otros';
  gender: 'macho' | 'hembra';
  description: string;
  castrado: 'si' | 'no' | 'no_se';
  adoptante: string;
  telefono: string;
  direccion: string;
  responsable: string;
  fechaAdopcion: string;
  notasPlam: string;
  notasSeguimiento: string;
  notasNatalia: string;
  fechaCastracion: string;
  estado: string;
  fotoUrl: string;
}

function formatPhone(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str || '—';
  return str.slice(0, maxLen) + '…';
}

function labelForLevel(level: string): string {
  const map: Record<string, string> = {
    url_exact: 'Match por URL exacta',
    url_name: 'Match por URL (nombre)',
    animal_name_adopted: 'Match por nombre (+adoptado)',
    animal_name: 'Match por nombre',
    desc_name_adopted: 'Match por descripción (+adoptado)',
    desc_name: 'Match por descripción',
    phone: 'Match por teléfono',
    adopter_name: 'Match por adoptante',
    fuzzy_name: 'Match difuso (nombre)',
    no_match: 'Sin match',
  };
  return map[level] || level;
}

export default function ConfirmarMatchesContent(): React.ReactElement {
  const [matchesData, setMatchesData] = useState<MatchEntry[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [filterMatch, setFilterMatch] = useState<FilterMatch>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<MatchEntry | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [confirmedData, setConfirmedData] = useState<ConfirmedEntry[]>([]);

  // --- Detail modal state ---
  const [detailEntry, setDetailEntry] = useState<MatchEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // --- Modal state ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalNameMap, setAnimalNameMap] = useState<Record<string, string>>({});
  const [animalSearch, setAnimalSearch] = useState<string>('');
  const [loadingAnimals, setLoadingAnimals] = useState<boolean>(false);

  // --- Step 2: comparison state ---
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedPrivateInfo, setSelectedPrivateInfo] = useState<PrivateInfoType | null>(null);
  const [fieldsToMigrate, setFieldsToMigrate] = useState<Set<string>>(new Set());
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [migrating, setMigrating] = useState<boolean>(false);
  // --- Create animal form state ---
  const [createFormEntry, setCreateFormEntry] = useState<MatchEntry | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState<boolean>(false);
  const [createFormSaving, setCreateFormSaving] = useState<boolean>(false);
  const [createFormNameError, setCreateFormNameError] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    name: '',
    species: 'perro',
    gender: 'macho',
    description: '',
    castrado: 'no_se',
    adoptante: '',
    telefono: '',
    direccion: '',
    responsable: '',
    fechaAdopcion: '',
    notasPlam: '',
    notasSeguimiento: '',
    notasNatalia: '',
    fechaCastracion: '',
    estado: '',
    fotoUrl: '',
  });

  /** Updates a single field in the creation form */
  const setCreateFormField = <K extends keyof CreateFormData>(
    field: K,
    value: CreateFormData[K]
  ): void => {
    setCreateFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch matches from Firestore
  useEffect(() => {
    const fetchMatches = async (): Promise<void> => {
      try {
        const [currentDoc, confirmedDoc] = await Promise.all([
          getFirestoreDocById<MatchesDoc>({
            currentCollection: 'seguimientoMatches',
            id: 'current',
          }),
          getFirestoreDocById<{ entries: ConfirmedEntry[]; updatedAt: number }>({
            currentCollection: 'seguimientoMatches',
            id: 'confirmed',
          }),
        ]);
        if (currentDoc?.entries && currentDoc.entries.length > 0) {
          setMatchesData(currentDoc.entries);
        }
        if (confirmedDoc?.entries) {
          setConfirmedData(confirmedDoc.entries);
        }
      } catch (error) {
        logger({
          level: 'error',
          code: 'FETCH_MATCHES',
          message: 'Error fetching matches from Firestore',
          data: error,
        });
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, []);

  /** Opens a read-only detail view of the CSV entry data */
  const openDetailModal = (entry: MatchEntry): void => {
    setDetailEntry(entry);
    setDetailOpen(true);
  };

  /** Maps raw CSV species text to the Animal.species union */
  const mapSpecies = (raw: string): 'perro' | 'gato' | 'otros' => {
    const lower = raw.toLowerCase().trim();
    if (lower === 'perro' || lower === 'canino' || lower === 'dog') return 'perro';
    if (lower === 'gato' || lower === 'felino' || lower === 'cat') return 'gato';
    return 'otros';
  };

  /** Maps raw CSV castrado text to YesNoUnknown */
  const mapCastrado = (raw: string): 'si' | 'no' | 'no_se' => {
    const lower = raw.toLowerCase().trim();
    if (lower === 'si' || lower === 'sí' || lower === 'yes') return 'si';
    if (lower === 'no') return 'no';
    return 'no_se';
  };

  /** Attempts to parse a date string; returns 0 on failure */
  const parseDate = (raw: string): number => {
    if (!raw) return 0;
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? 0 : parsed;
  };

  /**
   * Opens a pre-filled form to create a basic animal from CSV data.
   * The user must review and confirm before the animal is saved.
   */
  const openCreateForm = (entry: MatchEntry): void => {
    const d = entry.csv_data;
    setCreateFormEntry(entry);
    setCreateFormData({
      name: (d.nombre_actual || d.descripcion_mascota || '').trim(),
      species: mapSpecies(d.tipo_animal),
      gender: 'macho',
      description: d.descripcion_mascota || '',
      castrado: d.castrado ? mapCastrado(d.castrado) : 'no_se',
      adoptante: d.nombre_adoptante || '',
      telefono: d.telefonos || '',
      direccion: d.direccion || '',
      responsable: d.responsable || '',
      fechaAdopcion: d.fecha_adopcion || '',
      notasPlam: d.notas_plam || '',
      notasSeguimiento: d.notas_seguimiento || '',
      notasNatalia: d.notas_natalia || '',
      fechaCastracion: d.fecha_castracion || '',
      estado: d.estado || '',
      fotoUrl: d.foto_url || '',
    });
    setCreateFormNameError(false);
    setCreateFormOpen(true);
  };

  /** Validates and saves the basic animal from the creation form */
  const handleConfirmCreateAnimal = async (): Promise<void> => {
    if (!createFormEntry) return;
    const f = createFormData;

    if (!f.name.trim()) {
      setCreateFormNameError(true);
      handleToast({
        type: 'error',
        title: 'Falta el nombre',
        text: 'El nombre del animal es obligatorio.',
      });
      return;
    }

    setCreateFormSaving(true);
    try {
      const id = await generateAnimalId();
      const now = createTimestamp();
      const species = f.species;
      const sterilized: 'si' | 'no' | 'no_se' = f.castrado;

      const images: Img[] = f.fotoUrl
        ? [{ imgId: `csv-${createFormEntry.csv_row}`, imgUrl: f.fotoUrl, imgAlt: f.name }]
        : [];

      const newAnimal: Animal = {
        id,
        name: f.name.trim(),
        gender: f.gender,
        species,
        images,
        description: f.description || '',
        aproxBirthDate: parseDate(createFormEntry.csv_data.edad_nacimiento) || now,
        lifeStage: 'adulto',
        size: 'no_se_sabe',
        compatibility: { dogs: 'no_se', cats: 'no_se', kids: 'no_se' },
        isSterilized: sterilized,
        isAvailable: false,
        isVisible: false,
        status: 'adoptado',
        waitingSince: now,
      };

      const notes: string[] = [];
      if (f.notasPlam) notes.push(`[PLAM] ${f.notasPlam}`);
      if (f.notasSeguimiento) notes.push(`[Seguimiento] ${f.notasSeguimiento}`);
      if (f.notasNatalia) notes.push(`[Natalia] ${f.notasNatalia}`);

      const newPrivateInfo: PrivateInfoType = {
        id,
        name: f.name.trim(),
        contactName: f.adoptante || '',
        contacts: f.telefono ? [{ type: 'celular' as const, value: f.telefono }] : [],
        address: f.direccion || '',
        caseManager: f.responsable ? [f.responsable] : [],
        followUpManager: f.responsable ? [f.responsable] : [],
        newName: f.name.trim(),
        rescueReason: 'other',
        notes: notes.length > 0 ? notes : undefined,
        species,
        mainImageUrl: f.fotoUrl || '',
        isSterilized: sterilized,
        isAdopted: true,
        followUpStatus: 'active',
        adoptionDate: parseDate(f.fechaAdopcion),
        sterilizationDate: parseDate(f.fechaCastracion),
        lastFollowUpDate: 0,
        lastFollowUpNote: '',
      };

      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({ data: newAnimal, currentCollection: 'animals', id }),
          postFirestoreData<PrivateInfoType>({
            data: newPrivateInfo,
            currentCollection: 'animalPrivateInfo',
            id,
          }),
        ]),
        {
          messages: {
            pending: { title: 'Creando', text: `Creando ficha para ${f.name}...` },
            success: { title: 'Creado', text: `${f.name} fue creado exitosamente` },
            error: { title: 'Error', text: 'No se pudo crear el animal' },
          },
        }
      );

      // Mark entry as confirmed — all data was saved during creation,
      // no need for the migration step (step 2)
      const confirmedEntry: ConfirmedEntry = {
        ...createFormEntry,
        migratedAt: Date.now(),
        migratedTo: id,
        migratedFields: [
          'contactName',
          'contacts',
          'address',
          'followUpManager',
          'newName',
          'isSterilized',
          'sterilizationDate',
          'notas_seguimiento',
          'notas_plam',
        ].filter((field) => {
          if (field === 'contactName') return !!f.adoptante;
          if (field === 'contacts') return !!f.telefono;
          if (field === 'address') return !!f.direccion;
          if (field === 'followUpManager') return !!f.responsable;
          if (field === 'isSterilized') return !!f.castrado;
          if (field === 'sterilizationDate') return !!f.fechaCastracion;
          if (field === 'notas_seguimiento') return !!f.notasSeguimiento;
          if (field === 'notas_plam') return !!f.notasPlam;
          return true; // newName always included
        }),
        animalImageUrl: f.fotoUrl || '',
      };

      const newCurrentEntries = matchesData.filter((e) => e.csv_row !== createFormEntry.csv_row);
      const newConfirmedEntries = [...confirmedData, confirmedEntry];

      const batch = writeBatch(db);
      batch.set(doc(db, 'seguimientoMatches', 'current'), {
        entries: newCurrentEntries,
        updatedAt: Date.now(),
      });
      batch.set(doc(db, 'seguimientoMatches', 'confirmed'), {
        entries: newConfirmedEntries,
        updatedAt: Date.now(),
      });
      await batch.commit();

      setMatchesData(newCurrentEntries);
      setConfirmedData(newConfirmedEntries);
      setCreateFormOpen(false);
      setCreateFormEntry(null);
      setModalOpen(false);
      setSelectedEntry(null);
      setSelectedAnimal(null);
      setSelectedPrivateInfo(null);
    } catch (error) {
      logger({
        level: 'error',
        code: 'CREATE_BASIC_ANIMAL',
        message: 'Error creating basic animal from CSV',
        data: error,
      });
    } finally {
      setCreateFormSaving(false);
    }
  };

  // Build animal ID → name map when animals load
  const updateAnimalMaps = (all: Animal[]): void => {
    const map: Record<string, string> = {};
    for (const a of all) {
      map[a.id] = a.name;
      if (a.name) map[a.name.toLowerCase()] = a.id;
    }
    setAnimalNameMap(map);
  };

  const filtered = useMemo(() => {
    if (filterMatch === 'confirmados') {
      let result = confirmedData as MatchEntry[];
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(
          (e) =>
            e.csv_data.nombre_adoptante.toLowerCase().includes(lower) ||
            e.csv_data.telefonos.toLowerCase().includes(lower) ||
            e.csv_data.nombre_actual.toLowerCase().includes(lower) ||
            e.csv_data.descripcion_mascota.toLowerCase().includes(lower) ||
            (e.primary_match_id || '').toLowerCase().includes(lower)
        );
      }
      return result;
    }

    let result = matchesData;

    if (filterMatch === 'matched') {
      result = result.filter((e) => e.match_level !== 'no_match' && e.primary_match_id !== null);
    } else if (filterMatch === 'unmatched') {
      result = result.filter((e) => e.match_level === 'no_match' || e.primary_match_id === null);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.csv_data.nombre_adoptante.toLowerCase().includes(lower) ||
          e.csv_data.telefonos.toLowerCase().includes(lower) ||
          e.csv_data.nombre_actual.toLowerCase().includes(lower) ||
          e.csv_data.descripcion_mascota.toLowerCase().includes(lower) ||
          (e.primary_match_id || '').toLowerCase().includes(lower)
      );
    }

    return result;
  }, [filterMatch, searchTerm, matchesData, confirmedData]);

  const openAssociateModal = async (entry: MatchEntry): Promise<void> => {
    setSelectedEntry(entry);
    setAnimalSearch('');
    setSelectedAnimal(null);
    setSelectedPrivateInfo(null);
    setFieldsToMigrate(new Set());
    setModalOpen(true);
    setLoadingAnimals(true);

    try {
      const allPrivateInfo = await getFirestoreData({
        currentCollection: 'animalPrivateInfo',
      });
      const typed = allPrivateInfo as unknown as PrivateInfoType[];
      // Build minimal Animal objects for the picker UI
      const allAnimals: Animal[] = typed.map((pi) => ({
        id: pi.id,
        name: pi.name,
        gender: 'macho',
        species: pi.species ?? 'perro',
        images: pi.mainImageUrl
          ? [{ imgId: pi.id, imgUrl: pi.mainImageUrl, imgAlt: pi.name || '' }]
          : [],
        description: '',
        aproxBirthDate: 0,
        lifeStage: 'adulto',
        size: 'no_se_sabe',
        compatibility: { dogs: 'no_se', cats: 'no_se', kids: 'no_se' },
        isSterilized: pi.isSterilized ?? 'no_se',
        isVisible: false,
        status: pi.isAdopted ? 'adoptado' : 'transitorio',
        waitingSince: 0,
      }));
      setAnimals(allAnimals);
      updateAnimalMaps(allAnimals);
    } catch (error) {
      logger({
        level: 'error',
        code: 'FETCH_ANIMALS_CONFIRMAR',
        message: 'Error fetching animals for match confirmation',
        data: error,
      });
    } finally {
      setLoadingAnimals(false);
    }
  };

  const handleSelectAnimal = async (animal: Animal): Promise<void> => {
    setSelectedAnimal(animal);
    try {
      const pi = await getFirestoreDocById<PrivateInfoType>({
        currentCollection: 'animalPrivateInfo',
        id: animal.id,
      });
      setSelectedPrivateInfo(pi ?? null);

      // Default: select all fields that have CSV data and differ from current
      const defaults = new Set<string>();
      const data = selectedEntry?.csv_data;
      if (data) {
        if (data.nombre_adoptante && data.nombre_adoptante !== (pi?.contactName ?? '')) {
          defaults.add('contactName');
        }
        if (
          data.telefonos &&
          data.telefonos !== formatPhone(String(pi?.contacts?.[0]?.value ?? ''))
        ) {
          defaults.add('contacts');
        }
        if (data.direccion && data.direccion !== (pi?.address ?? '')) {
          defaults.add('address');
        }
        if (data.responsable && !pi?.followUpManager?.includes(data.responsable)) {
          defaults.add('followUpManager');
        }
        if (data.nombre_actual && data.nombre_actual !== (pi?.newName ?? '')) {
          defaults.add('newName');
        }
        if (data.castrado) {
          defaults.add('isSterilized');
        }
        if (data.fecha_castracion) {
          defaults.add('sterilizationDate');
        }
        if (data.notas_seguimiento) {
          defaults.add('notas_seguimiento');
        }
        if (data.notas_plam) {
          defaults.add('notas_plam');
        }
      }
      setFieldsToMigrate(defaults);

      // Initialize editable values from CSV data
      if (data) {
        setEditableValues({
          contactName: data.nombre_adoptante || '',
          contacts: data.telefonos || '',
          address: data.direccion || '',
          followUpManager: data.responsable || '',
          newName: data.nombre_actual || '',
          castrado: data.castrado || '',
          fecha_castracion: data.fecha_castracion || '',
          notas_seguimiento: data.notas_seguimiento || '',
          notas_plam: data.notas_plam || '',
        });
      }
    } catch (error) {
      logger({
        level: 'error',
        code: 'FETCH_PI_CONFIRMAR',
        message: 'Error loading privateInfo',
        data: error,
      });
    }
  };

  const handleBackToSearch = (): void => {
    setSelectedAnimal(null);
    setSelectedPrivateInfo(null);
    setFieldsToMigrate(new Set());
    setEditableValues({});
  };

  const toggleField = (field: string): void => {
    setFieldsToMigrate((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleMigrate = async (): Promise<void> => {
    if (!selectedAnimal || !selectedEntry || fieldsToMigrate.size === 0) return;
    setMigrating(true);

    const ev = editableValues;
    const updates: Record<string, unknown> = {};

    if (fieldsToMigrate.has('contactName') && ev.contactName) {
      updates.contactName = ev.contactName;
    }
    if (fieldsToMigrate.has('contacts') && ev.contacts) {
      updates.contacts = [{ type: 'celular', value: ev.contacts }];
    }
    if (fieldsToMigrate.has('address') && ev.address) {
      updates.address = ev.address;
    }
    if (fieldsToMigrate.has('followUpManager') && ev.followUpManager) {
      updates.followUpManager = [ev.followUpManager];
    }
    if (fieldsToMigrate.has('newName') && ev.newName) {
      updates.newName = ev.newName;
    }
    if (fieldsToMigrate.has('isSterilized') && ev.castrado) {
      const normalizedCastrado = ev.castrado.toLowerCase().trim();
      if (normalizedCastrado === 'si') {
        updates.isSterilized = 'si';
      } else if (normalizedCastrado === 'no') {
        updates.isSterilized = 'no';
      } else {
        updates.isSterilized = 'no_se';
      }
    }
    if (fieldsToMigrate.has('sterilizationDate') && ev.fecha_castracion) {
      // Store as float timestamp if parseable, otherwise as-is
      const parsed = Date.parse(ev.fecha_castracion);
      updates.sterilizationDate = isNaN(parsed) ? 0 : parsed;
    }
    // Notes: append to existing array instead of overwriting
    const rawNotes = selectedPrivateInfo?.notes;
    const existingNotes: string[] = Array.isArray(rawNotes)
      ? rawNotes
      : rawNotes
        ? [String(rawNotes)]
        : [];
    const newNotes: string[] = [];
    if (fieldsToMigrate.has('notas_seguimiento') && ev.notas_seguimiento) {
      newNotes.push(`[Seguimiento CSV] - ${ev.notas_seguimiento}`);
    }
    if (fieldsToMigrate.has('notas_plam') && ev.notas_plam) {
      newNotes.push(`[Notas PLAM CSV] - ${ev.notas_plam}`);
    }
    // If not yet castrated but a planned date exists, add a note
    if (
      fieldsToMigrate.has('isSterilized') &&
      ev.castrado &&
      ev.castrado.toLowerCase().trim() !== 'si' &&
      ev.fecha_castracion
    ) {
      newNotes.push(`Fecha planeada para castración: ${ev.fecha_castracion}`);
    }
    if (newNotes.length > 0) {
      updates.notes = [...existingNotes, ...newNotes];
    }

    try {
      const piRef = doc(db, 'animalPrivateInfo', selectedAnimal.id);
      const migratedFields = [...fieldsToMigrate];

      // Build confirmed entry with migration metadata
      const confirmedEntry: ConfirmedEntry = {
        ...selectedEntry,
        migratedAt: Date.now(),
        migratedTo: selectedAnimal.id,
        migratedFields,
        animalImageUrl:
          selectedAnimal.images?.[0]?.imgUrl ?? selectedPrivateInfo?.mainImageUrl ?? '',
      };

      // Prepare new arrays for optimistic update
      const newCurrentEntries = matchesData.filter((e) => e.csv_row !== selectedEntry.csv_row);
      const newConfirmedEntries = [...confirmedData, confirmedEntry];

      // Batch: update privateInfo + animal + remove from current + add to confirmed
      const batch = writeBatch(db);
      batch.update(piRef, updates);
      // Keep Animal.isSterilized in sync with PrivateInfo.isSterilized
      if (fieldsToMigrate.has('isSterilized') && updates.isSterilized !== undefined) {
        const animalRef = doc(db, 'animals', selectedAnimal.id);
        batch.update(animalRef, { isSterilized: updates.isSterilized });
      }
      batch.set(doc(db, 'seguimientoMatches', 'current'), {
        entries: newCurrentEntries,
        updatedAt: Date.now(),
      });
      batch.set(doc(db, 'seguimientoMatches', 'confirmed'), {
        entries: newConfirmedEntries,
        updatedAt: Date.now(),
      });

      await handlePromiseToast(batch.commit(), {
        messages: {
          pending: { title: 'Migrando', text: 'Copiando datos del CSV a Firestore...' },
          success: { title: 'Migrado', text: `Datos migrados a ${selectedAnimal.name}` },
          error: { title: 'Error', text: 'No se pudo migrar' },
        },
      });

      // Update local state after successful batch commit
      setMatchesData(newCurrentEntries);
      setConfirmedData(newConfirmedEntries);

      setModalOpen(false);
      setSelectedEntry(null);
      setSelectedAnimal(null);
      setSelectedPrivateInfo(null);
    } catch (error) {
      logger({
        level: 'error',
        code: 'MIGRATE_MATCH_ERROR',
        message: 'Error migrating match entry',
        data: error,
      });
    } finally {
      setMigrating(false);
    }
  };

  // Animal suggestions for the selected entry
  const suggestedAnimals = useMemo(() => {
    if (!selectedEntry || !selectedEntry.all_matched_ids.length || animals.length === 0) return [];
    const idSet = new Set(selectedEntry.all_matched_ids);
    return animals.filter((a) => idSet.has(a.id));
  }, [selectedEntry, animals]);

  const searchedAnimals = useMemo(() => {
    if (!animalSearch.trim()) return [];
    const lower = animalSearch.toLowerCase();
    return animals
      .filter((a) => a.name.toLowerCase().includes(lower) || a.id.toLowerCase().includes(lower))
      .slice(0, 20);
  }, [animalSearch, animals]);

  // Build comparison fields
  const comparisonFields = useMemo((): MigrateField[] => {
    if (!selectedAnimal || !selectedEntry) return [];
    const pi = selectedPrivateInfo;
    const ev = editableValues;

    const currentContacts = pi?.contacts?.map((c) => `${c.type}: ${c.value}`).join(', ') ?? '';

    return [
      {
        key: 'contactName',
        label: 'Nombre adoptante',
        currentValue: pi?.contactName ?? '(vacío)',
        newValue: ev.contactName || '(vacío)',
        hasChanged: (ev.contactName || '') !== (pi?.contactName ?? '') && !!ev.contactName,
      },
      {
        key: 'contacts',
        label: 'Teléfono',
        currentValue: currentContacts || '(vacío)',
        newValue: ev.contacts || '(vacío)',
        hasChanged:
          (ev.contacts || '') !== formatPhone(String(pi?.contacts?.[0]?.value ?? '')) &&
          !!ev.contacts,
      },
      {
        key: 'address',
        label: 'Dirección',
        currentValue: pi?.address ?? '(vacío)',
        newValue: ev.address || '(vacío)',
        hasChanged: (ev.address || '') !== (pi?.address ?? '') && !!ev.address,
      },
      {
        key: 'followUpManager',
        label: 'Resp. seguimiento',
        currentValue: pi?.followUpManager?.join(', ') ?? '(vacío)',
        newValue: ev.followUpManager || '(vacío)',
        hasChanged:
          (ev.followUpManager || '') !== (pi?.followUpManager?.[0] ?? '') && !!ev.followUpManager,
      },
      {
        key: 'newName',
        label: 'Nombre actual',
        currentValue: pi?.newName ?? '(vacío)',
        newValue: ev.newName || '(vacío)',
        hasChanged: (ev.newName || '') !== (pi?.newName ?? '') && !!ev.newName,
      },
      {
        key: 'isSterilized',
        label: 'Castrado',
        currentValue:
          pi?.isSterilized === 'si' ? 'Sí' : pi?.isSterilized === 'no' ? 'No' : 'No se sabe',
        newValue: ev.castrado || '(vacío)',
        hasChanged: !!(ev.castrado || ''),
      },
      {
        key: 'sterilizationDate',
        label: 'Fecha castración',
        currentValue: pi?.sterilizationDate ? String(pi.sterilizationDate) : '(sin fecha)',
        newValue: ev.fecha_castracion || '(vacío)',
        hasChanged: !!(ev.fecha_castracion || ''),
      },
      {
        key: 'notas_seguimiento',
        label: 'Notas seguimiento',
        currentValue: '(sin notas previas)',
        newValue: truncate(ev.notas_seguimiento || '', 200) || '(vacío)',
        hasChanged: !!(ev.notas_seguimiento || ''),
      },
      {
        key: 'notas_plam',
        label: 'Notas PLAM',
        currentValue: '(sin notas previas)',
        newValue: truncate(ev.notas_plam || '', 200) || '(vacío)',
        hasChanged: !!(ev.notas_plam || ''),
      },
    ];
  }, [selectedAnimal, selectedEntry, selectedPrivateInfo, editableValues]);

  const matchCount = matchesData.filter(
    (e) => e.match_level !== 'no_match' && e.primary_match_id !== null
  ).length;
  const unmatchedCount = matchesData.length - matchCount;
  const confirmedCount = confirmedData.length;

  // Get animal name from ID for badge display
  const getAnimalNameFromId = (id: string): string => {
    return animalNameMap[id] || animals.find((a) => a.id === id)?.name || id;
  };

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      {loadingMatches ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader />
        </div>
      ) : (
        <section className="bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-4 items-center pb-28 min-h-screen">
          {/* Header */}
          <div className="w-full max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-green-dark">
                  Confirmar Matches
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa y asocia las entradas del CSV con animales en Firestore
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {matchCount} con match
                </span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                  {unmatchedCount} sin match
                </span>
                {confirmedCount > 0 && (
                  <button
                    onClick={() => setFilterMatch('confirmados')}
                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                      filterMatch === 'confirmados'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-800'
                    }`}
                    title="Ver confirmados"
                  >
                    {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-7xl">
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <label htmlFor="match-filter" className="text-sm font-semibold text-green-dark">
                  Estado
                </label>
                <select
                  id="match-filter"
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                  value={filterMatch}
                  onChange={(e) => setFilterMatch(e.target.value as FilterMatch)}
                >
                  <option value="todos">Todos ({matchesData.length})</option>
                  <option value="matched">Con match ({matchCount})</option>
                  <option value="unmatched">Sin match ({unmatchedCount})</option>
                  <option value="confirmados">Confirmados ({confirmedCount})</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label htmlFor="search-match" className="text-sm font-semibold text-green-dark">
                  Buscar
                </label>
                <input
                  id="search-match"
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Nombre adoptante, animal, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className="w-full max-w-7xl">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl">
                <PetsIcon
                  size={64}
                  color="currentColor"
                  title="Sin resultados"
                  className="mb-4 opacity-50"
                />
                <p className="text-xl">No se encontraron entradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((entry) => {
                  const d = entry.csv_data;
                  const isConfirmed =
                    'migratedAt' in entry && (entry as ConfirmedEntry).migratedAt > 0;
                  const isMatched =
                    entry.match_level !== 'no_match' && entry.primary_match_id !== null;
                  const confidence = entry.all_candidates[0]?.confidence ?? 0;
                  const confidenceColor =
                    confidence >= 0.8
                      ? 'bg-green-100 text-green-800'
                      : confidence >= 0.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600';
                  const matchLabel = isMatched
                    ? `${getAnimalNameFromId(entry.primary_match_id!)} · ${labelForLevel(entry.match_level)}`
                    : 'sin match';

                  return (
                    <div
                      key={entry.csv_row}
                      className={`bg-white rounded-xl shadow-sm border-2 p-4 flex flex-col gap-3 ${
                        isConfirmed
                          ? 'border-blue-300'
                          : isMatched
                            ? 'border-green-300'
                            : 'border-red-200'
                      }`}
                    >
                      {/* Match status badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full truncate max-w-[60%] ${
                            isConfirmed
                              ? 'bg-blue-100 text-blue-800'
                              : isMatched
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isConfirmed
                            ? `Migrado → ${getAnimalNameFromId((entry as ConfirmedEntry).migratedTo)}`
                            : matchLabel}
                        </span>
                        {isMatched && !isConfirmed && (
                          <span className={`text-xs px-2 py-1 rounded-full ${confidenceColor}`}>
                            {Math.round(confidence * 100)}%
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {new Date((entry as ConfirmedEntry).migratedAt).toLocaleDateString(
                              'es-UY',
                              {
                                day: '2-digit',
                                month: '2-digit',
                              }
                            )}
                          </span>
                        )}
                      </div>

                      {/* Animal photo — confirmed entries only */}
                      {isConfirmed && (entry as ConfirmedEntry).animalImageUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={(entry as ConfirmedEntry).animalImageUrl}
                            alt={getAnimalNameFromId((entry as ConfirmedEntry).migratedTo)}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />
                          <span className="text-xs text-gray-500">Animal asignado</span>
                        </div>
                      )}

                      {/* Adopter info */}
                      <div>
                        <p className="text-sm font-semibold text-green-dark truncate">
                          {d.nombre_adoptante || 'Sin nombre'}
                        </p>
                        {d.telefonos && (
                          <a
                            href={`https://wa.me/${formatPhone(d.telefonos)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneIcon size={12} />
                            {truncate(d.telefonos, 25)}
                          </a>
                        )}
                      </div>

                      {/* Animal info */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {d.nombre_actual && (
                          <p>
                            <span className="font-medium">Animal:</span> {d.nombre_actual}
                          </p>
                        )}
                        {d.descripcion_mascota && (
                          <p title={d.descripcion_mascota}>
                            <span className="font-medium">Desc:</span>{' '}
                            {truncate(d.descripcion_mascota, 80)}
                          </p>
                        )}
                        {d.notas_plam && (
                          <p title={d.notas_plam}>
                            <span className="font-medium">Notas:</span> {truncate(d.notas_plam, 60)}
                          </p>
                        )}
                      </div>

                      {/* Match info or Migration info */}
                      {isConfirmed ? (
                        <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Migrado a {getAnimalNameFromId((entry as ConfirmedEntry).migratedTo)}
                            </p>
                            <p>{(entry as ConfirmedEntry).migratedFields.length} campos</p>
                          </div>
                          <Link
                            href={`/plam-admin/animales/${(entry as ConfirmedEntry).migratedTo}`}
                            target="_blank"
                            className="p-1 rounded hover:bg-blue-100 transition-colors text-blue-500 hover:text-blue-700 shrink-0 flex items-center gap-0.5"
                            title="Ver ficha completa"
                          >
                            <EyeIcon size={14} />
                            <span className="text-xs">ver</span>
                          </Link>
                        </div>
                      ) : isMatched ? (
                        <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
                          <p className="font-medium">{labelForLevel(entry.match_level)}</p>
                          {entry.all_matched_ids.length > 1 && (
                            <p className="truncate">
                              IDs:{' '}
                              {entry.all_matched_ids
                                .map((id) => getAnimalNameFromId(id))
                                .join(', ')}
                            </p>
                          )}
                          <p className="text-blue-600 mt-1 text-xs">{entry.match_reason}</p>
                        </div>
                      ) : null}

                      {/* Action button — only for non-confirmed entries */}
                      {!isConfirmed && (
                        <button
                          onClick={() => openAssociateModal(entry)}
                          className={`w-full mt-auto py-2 rounded-lg text-sm font-semibold transition-colors ${
                            isMatched
                              ? 'bg-green-dark text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          Asociar a animal
                        </button>
                      )}

                      {/* Row reference */}
                      <button
                        onClick={() => openDetailModal(entry)}
                        className="text-[10px] text-gray-400 hover:text-green-dark hover:underline mt-auto pt-1 text-left transition-colors"
                      >
                        Ver datos de la hoja
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Mostrando {filtered.length} de{' '}
            {filterMatch === 'confirmados' ? confirmedCount : matchesData.length} entradas
          </p>

          {/* ─── Modal: Step 1 (pick animal) → Step 2 (compare & migrate) ─── */}
          {selectedEntry && (
            <Modal isOpen={modalOpen} setIsOpen={setModalOpen} buttonStyles="hidden" buttonText="">
              <section className="flex flex-col items-center justify-start bg-cream-light w-full p-6 gap-4 text-left pb-28 min-h-full">
                <h2 className="font-extrabold text-2xl sm:text-3xl text-green-dark text-center ">
                  {selectedAnimal ? 'Comparar y migrar datos' : 'Asociar entrada CSV'}
                </h2>

                {/* ─── STEP 1: Pick animal ─── */}
                {!selectedAnimal && (
                  <>
                    {/* CSV data summary */}
                    <div className="w-full max-w-2xl bg-white rounded-lg p-4 border border-gray-200 text-sm space-y-2">
                      <p>
                        <span className="font-semibold">Adoptante:</span>{' '}
                        {selectedEntry.csv_data.nombre_adoptante || '—'}
                      </p>
                      <p>
                        <span className="font-semibold">Teléfono:</span>{' '}
                        {selectedEntry.csv_data.telefonos || '—'}
                      </p>
                      <p>
                        <span className="font-semibold">Animal CSV:</span>{' '}
                        {selectedEntry.csv_data.nombre_actual ||
                          truncate(selectedEntry.csv_data.descripcion_mascota, 40) ||
                          '—'}
                      </p>
                      <p>
                        <span className="font-semibold">Responsable:</span>{' '}
                        {selectedEntry.csv_data.responsable || '—'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {labelForLevel(selectedEntry.match_level)}: {selectedEntry.match_reason}
                      </p>
                      <button
                        onClick={() => openDetailModal(selectedEntry)}
                        className="text-xs text-green-dark hover:underline w-full text-left"
                      >
                        Ver todos los datos de la hoja
                      </button>
                    </div>

                    {/* Create basic animal when no match exists */}
                    <div className="w-full max-w-2xl">
                      <button
                        onClick={() => openCreateForm(selectedEntry)}
                        className="w-full py-2 rounded-lg text-sm font-semibold transition-colors bg-amber-sunset text-white hover:bg-amber-600"
                      >
                        Crear animal básico (sin match en la web)
                      </button>
                      <p className="text-xs text-gray-400 mt-1">
                        Abre un formulario pre-rellenado con los datos del CSV para revisar y
                        confirmar
                      </p>
                    </div>

                    {/* Suggested matches */}
                    {suggestedAnimals.length > 0 && (
                      <div className="w-full max-w-2xl">
                        <h3 className="text-sm font-semibold text-green-dark mb-2">
                          Coincidencias sugeridas
                        </h3>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {suggestedAnimals.map((animal) => (
                            <div
                              key={animal.id}
                              className="flex items-center gap-3 bg-white border border-green-300 rounded-lg p-3"
                            >
                              {animal.images?.[0]?.imgUrl ? (
                                <img
                                  src={animal.images?.[0]?.imgUrl ?? '/logo300.webp'}
                                  alt={animal.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-green-forest flex items-center justify-center text-white">
                                  <PetsIcon size={24} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-semibold text-sm truncate">{animal.name}</p>
                                  <Link
                                    href={`/plam-admin/animales/${animal.id}`}
                                    target="_blank"
                                    className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-green-dark shrink-0 flex items-center gap-0.5"
                                    title="Ver ficha completa"
                                  >
                                    <EyeIcon size={14} />
                                    <span className="hidden sm:inline text-xs">ver ficha</span>
                                  </Link>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {animal.id} · {animal.status} · {animal.species}
                                </p>
                              </div>
                              <button
                                onClick={() => handleSelectAnimal(animal)}
                                className="bg-green-dark text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shrink-0"
                              >
                                Seleccionar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestedAnimals.length > 0 && (
                      <div className="w-full max-w-2xl flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-300" />
                        <span className="text-xs text-gray-400">o buscar otro</span>
                        <div className="flex-1 border-t border-gray-300" />
                      </div>
                    )}

                    <div className="w-full max-w-2xl">
                      <label className="block text-sm font-semibold text-green-dark mb-1">
                        {suggestedAnimals.length === 0
                          ? 'Buscar animal'
                          : 'Buscar entre todos los animales'}
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border-2 border-green-dark bg-white rounded-lg text-sm"
                        placeholder="Nombre o ID del animal..."
                        value={animalSearch}
                        onChange={(e) => setAnimalSearch(e.target.value)}
                      />
                    </div>

                    {loadingAnimals && (
                      <div className="w-full max-w-2xl flex justify-center py-8">
                        <Loader />
                      </div>
                    )}

                    {animalSearch.trim() && searchedAnimals.length > 0 && (
                      <div className="w-full max-w-2xl flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {searchedAnimals.map((animal) => (
                          <div
                            key={animal.id}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3"
                          >
                            {animal.images?.[0]?.imgUrl ? (
                              <img
                                src={animal.images?.[0]?.imgUrl ?? '/logo300.webp'}
                                alt={animal.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-green-forest flex items-center justify-center text-white">
                                <PetsIcon size={24} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-sm truncate">{animal.name}</p>
                                <Link
                                  href={`/plam-admin/animales/${animal.id}`}
                                  target="_blank"
                                  className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-green-dark shrink-0 flex items-center gap-0.5"
                                  title="Ver ficha completa"
                                >
                                  <EyeIcon size={14} />
                                  <span className="hidden sm:inline text-xs">ver ficha</span>
                                </Link>
                              </div>
                              <p className="text-xs text-gray-500">
                                {animal.id} · {animal.status} · {animal.species}
                              </p>
                            </div>
                            <button
                              onClick={() => handleSelectAnimal(animal)}
                              className="bg-green-dark text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shrink-0"
                            >
                              Seleccionar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {animalSearch.trim() && !loadingAnimals && searchedAnimals.length === 0 && (
                      <p className="text-sm text-gray-400">No se encontraron animales</p>
                    )}

                    {!animalSearch.trim() && suggestedAnimals.length === 0 && !loadingAnimals && (
                      <div className="w-full max-w-2xl">
                        <p className="text-sm text-gray-500 mb-2">
                          Escribe para buscar entre {animals.length} animales
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* ─── STEP 2: Compare & migrate ─── */}
                {selectedAnimal && selectedEntry && (
                  <>
                    {/* Animal header */}
                    <div className="w-full max-w-2xl flex items-center gap-3 bg-green-50 border border-green-300 rounded-lg p-3">
                      {selectedAnimal.images?.[0]?.imgUrl ? (
                        <img
                          src={selectedAnimal.images?.[0]?.imgUrl ?? '/logo300.webp'}
                          alt={selectedAnimal.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-green-forest flex items-center justify-center text-white">
                          <PetsIcon size={28} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg">{selectedAnimal.name}</p>
                        <p className="text-xs text-gray-500">
                          {selectedAnimal.id} · {selectedAnimal.status} · {selectedAnimal.species}
                        </p>
                      </div>
                      <button
                        onClick={handleBackToSearch}
                        className="text-xs text-gray-500 hover:text-red-600 underline shrink-0"
                      >
                        Cambiar animal
                      </button>
                    </div>

                    <button
                      onClick={() => openDetailModal(selectedEntry)}
                      className="w-full max-w-2xl text-xs text-green-dark hover:underline text-left"
                    >
                      Ver todos los datos de la hoja
                    </button>

                    {/* Comparison table */}
                    <div className="w-full max-w-2xl bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[320px] overflow-y-auto">
                      <div className="grid grid-cols-[24px_1fr_1fr_1fr] gap-2 p-3 bg-gray-100 text-xs font-semibold text-gray-600">
                        <span></span>
                        <span className="truncate">Campo</span>
                        <span className="truncate">CSV (origen) →</span>
                        <span className="truncate">Firestore (destino)</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {comparisonFields.map((field) => (
                          <div
                            key={field.key}
                            className={`grid grid-cols-[24px_1fr_1fr_1fr] gap-2 p-3 text-xs ${
                              field.hasChanged ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={fieldsToMigrate.has(field.key)}
                              onChange={() => toggleField(field.key)}
                              className="w-3.5 h-3.5 accent-green-dark mt-0.5"
                              disabled={
                                !field.hasChanged &&
                                field.key !== 'notas_seguimiento' &&
                                field.key !== 'notas_plam'
                              }
                            />
                            <span className="font-medium text-gray-700 truncate">
                              {field.label}
                            </span>
                            <input
                              type="text"
                              className={`w-full text-xs p-1 rounded border ${
                                field.hasChanged
                                  ? 'border-green-400 bg-green-50 text-green-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-400'
                              } truncate`}
                              value={editableValues[field.key] || ''}
                              onChange={(e) =>
                                setEditableValues((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              title={editableValues[field.key] || ''}
                            />
                            <span
                              className={`truncate text-xs ${field.currentValue === '(vacío)' ? 'text-gray-400 italic' : 'text-gray-600'}`}
                              title={field.currentValue}
                            >
                              {field.currentValue}
                              {field.hasChanged && (
                                <span className="ml-1 text-green-600 font-bold">←</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected count */}
                    <p className="text-xs text-gray-500">
                      {fieldsToMigrate.size} campo{fieldsToMigrate.size !== 1 ? 's' : ''}{' '}
                      seleccionado
                      {fieldsToMigrate.size !== 1 ? 's' : ''} para migrar
                    </p>

                    {/* Migrate button */}
                    <button
                      onClick={handleMigrate}
                      disabled={fieldsToMigrate.size === 0 || migrating}
                      className="w-full max-w-2xl bg-green-dark text-white text-lg px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {migrating
                        ? 'Migrando…'
                        : `Confirmar migración (${fieldsToMigrate.size} campos)`}
                    </button>
                  </>
                )}
              </section>
            </Modal>
          )}

          {/* ─── Detail modal: read-only CSV entry data ─── */}
          {detailEntry && (
            <Modal
              isOpen={detailOpen}
              setIsOpen={setDetailOpen}
              buttonStyles="hidden"
              buttonText=""
            >
              <section className="flex flex-col items-center justify-start bg-cream-light w-full p-6 gap-4 text-left overflow-hidden max-h-full">
                <h2 className="font-extrabold text-2xl sm:text-3xl text-green-dark text-center shrink-0">
                  Datos de la hoja de Google
                </h2>

                <div className="w-full max-w-lg flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-1">
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shrink-0">
                    {(
                      [
                        ['Responsable', detailEntry.csv_data.responsable],
                        ['Notas PLAM', detailEntry.csv_data.notas_plam],
                        ['Fecha adopción', detailEntry.csv_data.fecha_adopcion],
                        ['Edad al nacer', detailEntry.csv_data.edad_nacimiento],
                        ['Tipo de animal', detailEntry.csv_data.tipo_animal],
                        ['Responsable adopción', detailEntry.csv_data.responsable_adopcion],
                        ['Nombre adoptante', detailEntry.csv_data.nombre_adoptante],
                        ['Teléfonos', detailEntry.csv_data.telefonos],
                        ['Dirección', detailEntry.csv_data.direccion],
                        ['Descripción', detailEntry.csv_data.descripcion_mascota],
                        ['Nombre actual', detailEntry.csv_data.nombre_actual],
                        ['Edad actual', detailEntry.csv_data.edad_actual],
                        ['Castrado', detailEntry.csv_data.castrado],
                        ['Contacto Natalia', detailEntry.csv_data.contacto_natalia],
                        ['Vacunas al día', detailEntry.csv_data.vacunas_al_dia],
                        ['Fecha castración', detailEntry.csv_data.fecha_castracion],
                        ['Estado', detailEntry.csv_data.estado],
                        ['Notas seguimiento', detailEntry.csv_data.notas_seguimiento],
                        ['Notas Natalia', detailEntry.csv_data.notas_natalia],
                        ['Foto URL', detailEntry.csv_data.foto_url],
                        ['Finalización', detailEntry.csv_data.finalizacion],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[140px_1fr] gap-3 p-3 text-sm">
                        <span className="font-semibold text-green-dark shrink-0">{label}</span>
                        <span
                          className={`break-all ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}
                        >
                          {value || '(vacío)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Match info */}
                  <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
                    <p>
                      <span className="font-semibold text-blue-800">Nivel de match:</span>{' '}
                      {labelForLevel(detailEntry.match_level)}
                    </p>
                    {detailEntry.primary_match_id && (
                      <p>
                        <span className="font-semibold text-blue-800">Animal asignado:</span>{' '}
                        {getAnimalNameFromId(detailEntry.primary_match_id)}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-blue-800">Razón:</span>{' '}
                      {detailEntry.match_reason || '—'}
                    </p>
                  </div>
                </div>
              </section>
            </Modal>
          )}

          {/* ─── Create basic animal form modal ─── */}
          {createFormEntry && (
            <Modal
              isOpen={createFormOpen}
              setIsOpen={setCreateFormOpen}
              buttonStyles="hidden"
              buttonText=""
            >
              <section className="flex flex-col items-center justify-start bg-cream-light w-full p-6 gap-4 text-left overflow-hidden max-h-full">
                <h2 className="font-extrabold text-2xl sm:text-3xl text-green-dark text-center shrink-0">
                  Crear animal desde hoja de Google
                </h2>
                <p className="text-sm text-gray-500 text-center -mt-2">
                  Revisá los datos antes de crear. Los campos de info privada se guardan
                  automáticamente.
                </p>

                <div className="w-full max-w-lg flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-1">
                  {/* Name — required */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">
                      Nombre <span className="text-red-500">*</span>
                    </span>
                    {createFormNameError && (
                      <span className="bg-red-500 text-white text-xs rounded px-2 py-0.5">
                        El nombre es obligatorio
                      </span>
                    )}
                    <input
                      type="text"
                      className={`outline-2 bg-white rounded p-2 text-sm border ${
                        createFormNameError ? 'border-red-500 outline-red-500' : 'outline-gray-200'
                      }`}
                      value={createFormData.name}
                      onChange={(e) => {
                        setCreateFormField('name', e.target.value);
                        if (createFormNameError) setCreateFormNameError(false);
                      }}
                      placeholder="Nombre del animal"
                    />
                  </label>

                  {/* Species */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Especie</span>
                    <select
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.species}
                      onChange={(e) =>
                        setCreateFormField('species', e.target.value as 'perro' | 'gato' | 'otros')
                      }
                    >
                      <option value="perro">Perro</option>
                      <option value="gato">Gato</option>
                      <option value="otros">Otros</option>
                    </select>
                  </label>

                  {/* Gender */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Género</span>
                    <select
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.gender}
                      onChange={(e) =>
                        setCreateFormField('gender', e.target.value as 'macho' | 'hembra')
                      }
                    >
                      <option value="macho">Macho</option>
                      <option value="hembra">Hembra</option>
                    </select>
                  </label>

                  {/* Description */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Descripción</span>
                    <textarea
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm field-sizing-content"
                      rows={3}
                      value={createFormData.description}
                      onChange={(e) => setCreateFormField('description', e.target.value)}
                      placeholder="Descripción del animal"
                    />
                  </label>

                  {/* Castrado */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Castrado</span>
                    <select
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.castrado}
                      onChange={(e) =>
                        setCreateFormField('castrado', e.target.value as 'si' | 'no' | 'no_se')
                      }
                    >
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                      <option value="no_se">No se sabe</option>
                    </select>
                  </label>

                  {/* Contact name */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Nombre adoptante</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.adoptante}
                      onChange={(e) => setCreateFormField('adoptante', e.target.value)}
                      placeholder="Nombre del adoptante"
                    />
                  </label>

                  {/* Phone */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Teléfono</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.telefono}
                      onChange={(e) => setCreateFormField('telefono', e.target.value)}
                      placeholder="Teléfono de contacto"
                    />
                  </label>

                  {/* Address */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Dirección</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.direccion}
                      onChange={(e) => setCreateFormField('direccion', e.target.value)}
                      placeholder="Dirección"
                    />
                  </label>

                  {/* Responsable */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">
                      Responsable seguimiento
                    </span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.responsable}
                      onChange={(e) => setCreateFormField('responsable', e.target.value)}
                      placeholder="Persona responsable"
                    />
                  </label>

                  {/* Adoption date */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Fecha adopción</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.fechaAdopcion}
                      onChange={(e) => setCreateFormField('fechaAdopcion', e.target.value)}
                      placeholder="DD/MM/AAAA o vacío"
                    />
                  </label>

                  {/* Notas PLAM */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Notas PLAM</span>
                    <textarea
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm field-sizing-content"
                      rows={2}
                      value={createFormData.notasPlam}
                      onChange={(e) => setCreateFormField('notasPlam', e.target.value)}
                      placeholder="Notas de PLAM"
                    />
                  </label>

                  {/* Notas seguimiento */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Notas seguimiento</span>
                    <textarea
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm field-sizing-content"
                      rows={2}
                      value={createFormData.notasSeguimiento}
                      onChange={(e) => setCreateFormField('notasSeguimiento', e.target.value)}
                      placeholder="Notas de seguimiento"
                    />
                  </label>

                  {/* Notas Natalia */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Notas Natalia</span>
                    <textarea
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm field-sizing-content"
                      rows={2}
                      value={createFormData.notasNatalia}
                      onChange={(e) => setCreateFormField('notasNatalia', e.target.value)}
                      placeholder="Notas de Natalia"
                    />
                  </label>

                  {/* Fecha castración */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Fecha castración</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.fechaCastracion}
                      onChange={(e) => setCreateFormField('fechaCastracion', e.target.value)}
                    />
                  </label>

                  {/* Estado */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Estado</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.estado}
                      onChange={(e) => setCreateFormField('estado', e.target.value)}
                    />
                  </label>

                  {/* Foto URL */}
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-green-dark text-sm">Foto URL</span>
                    <input
                      type="text"
                      className="outline-2 bg-white outline-gray-200 rounded p-2 text-sm"
                      value={createFormData.fotoUrl}
                      onChange={(e) => setCreateFormField('fotoUrl', e.target.value)}
                      placeholder="URL de la foto del CSV"
                    />
                  </label>
                  <button
                    onClick={() => openDetailModal(createFormEntry)}
                    className="text-green-dark hover:underline mt-1 text-xs"
                  >
                    Ver todos los datos de la hoja
                  </button>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                    El animal se creará como <strong>adoptado</strong> y <strong>no visible</strong>{' '}
                    en la web.
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleConfirmCreateAnimal}
                  disabled={createFormSaving}
                  className="w-full max-w-lg bg-green-dark text-white text-lg px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {createFormSaving ? 'Creando…' : 'Crear animal y continuar'}
                </button>
              </section>
            </Modal>
          )}
        </section>
      )}
    </ProtectedRoute>
  );
}
