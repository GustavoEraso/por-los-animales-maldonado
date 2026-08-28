'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Loader from '@/components/Loader';
import TransactionCard from '@/components/TransactionCard';
import { auth } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast } from '@/lib/handleToast';
import { createTimestamp } from '@/lib/dateUtils';
import { eventLabels } from '@/lib/constants/animalLabels';
import { logger } from '@/lib/logger';
import UploadImages from '@/elements/UploadImage';
import { AnimalTransactionType, Img } from '@/types';

const MIN_LOADING_TIME = 600;

const EXTERNAL_EVENT_TYPES = [
  'transfer',
  'medical',
  'vaccination',
  'sterilization',
  'emergency',
  'supply',
  'other',
];

interface ExternalEventFormData {
  name: string;
  eventType: AnimalTransactionType['transactionType'];
  note: string;
  cost: string;
}

const DEFAULT_FORM_DATA: ExternalEventFormData = {
  name: '',
  eventType: 'transfer',
  note: '',
  cost: '',
};

/**
 * Admin page to register events for animals without a profile (external cases),
 * e.g. a dog transferred from a foster home to the vet without being registered.
 * Creates transactions in animalTransactions with a synthetic id and isExternal flag.
 */
export default function CasosExternosPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [externalTransactions, setExternalTransactions] = useState<AnimalTransactionType[]>([]);
  const [formData, setFormData] = useState<ExternalEventFormData>(DEFAULT_FORM_DATA);
  const [eventImages, setEventImages] = useState<Img[]>([]);

  const loadExternalTransactions = async (): Promise<void> => {
    const start = Date.now();
    try {
      const data = await getFirestoreData({
        currentCollection: 'animalTransactions',
        orderBy: 'date',
        direction: 'desc',
        filter: [['isExternal', '==', true]],
      });
      setExternalTransactions(data as AnimalTransactionType[]);
    } catch (error) {
      console.error('Error loading external case transactions:', error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadExternalTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (saving) return;
    if (!formData.name.trim() || !formData.note.trim()) return;

    setSaving(true);
    const now = createTimestamp();
    const notePrefix = `[${formData.eventType ? eventLabels[formData.eventType] : 'Otro'}] - `;
    const costValue = formData.cost.trim() ? parseFloat(formData.cost) : undefined;

    const newTransaction: AnimalTransactionType = {
      id: `externo_${now}`,
      name: formData.name.trim(),
      img: eventImages[0],
      eventImg: eventImages.length > 0 ? eventImages : undefined,
      transactionType: formData.eventType,
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      cost: costValue,
      isExternal: true,
      changes: {
        after: {
          notes: [notePrefix + formData.note.trim()],
        },
      },
    };

    try {
      await handlePromiseToast(postTransactionData({ data: newTransaction }), {
        messages: {
          pending: { title: 'Registrando caso externo', text: 'Por favor espera...' },
          success: { title: 'Caso externo registrado', text: 'El evento se registró exitosamente' },
          error: { title: 'Error', text: 'No se pudo registrar el caso externo' },
        },
      });
      setFormData(DEFAULT_FORM_DATA);
      setEventImages([]);
      await loadExternalTransactions();
    } catch (error) {
      logger({
        level: 'error',
        code: 'CREATE_EXTERNAL_TRANSACTION',
        message: 'Error creating external case transaction:',
        data: error,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-4 items-center pb-28">
      {loading && <Loader />}
      <div className="w-full flex justify-start">
        <Link href={'/plam-admin'} className="flex items-center gap-2 px-2 text-gray-400">
          <h3 className="text-2xl font-bold underline">Volver</h3>
        </Link>
      </div>
      <h1 className="text-4xl font-bold underline">Casos externos</h1>
      <p className="text-sm text-gray-600 max-w-2xl text-center">
        Registrá eventos de animales que no tienen ficha en el sistema (por ejemplo, un traslado
        desde un hogar transitorio a la veterinaria).
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col gap-4 bg-white border border-green-dark/20 rounded-2xl shadow-md p-4"
      >
        <div>
          <label htmlFor="external-name" className="block text-green-dark font-semibold mb-2">
            Nombre o descripción del animal *
          </label>
          <input
            id="external-name"
            type="text"
            className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
            placeholder="Ej: Perro negro sin identificación"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="external-type" className="block text-green-dark font-semibold mb-2">
            Tipo de evento *
          </label>
          <select
            id="external-type"
            className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
            value={formData.eventType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                eventType: e.target.value as AnimalTransactionType['transactionType'],
              }))
            }
          >
            {EXTERNAL_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {eventLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="external-note" className="block text-green-dark font-semibold mb-2">
            Descripción del evento *
          </label>
          <textarea
            id="external-note"
            className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
            placeholder="Escribe información sobre el evento..."
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="external-cost" className="block text-green-dark font-semibold mb-2">
            Costo (opcional)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-green-dark text-xl">$</span>
            <input
              id="external-cost"
              type="number"
              step="1"
              min="0"
              className="flex-1 p-2 border-2 border-green-dark bg-white rounded-lg"
              placeholder="0"
              value={formData.cost}
              onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-green-dark font-semibold mb-2">
            Imágenes (opcional, máx. 5)
          </label>
          {eventImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {eventImages.map((img) => (
                <img
                  key={img.imgId}
                  src={img.imgUrl}
                  alt={img.imgAlt}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-green-dark"
                />
              ))}
            </div>
          )}
          {eventImages.length < 5 && (
            <UploadImages
              maxFiles={5 - eventImages.length}
              currentFolder="follow_up"
              onImagesAdd={(imgs) => {
                setEventImages((prev) => {
                  const newImages = imgs.map((img) => ({
                    ...img,
                    imgAlt: `Caso externo - ${formData.name || 'sin nombre'}`,
                  }));
                  return [...prev, ...newImages].slice(0, 5);
                });
              }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !formData.name.trim() || !formData.note.trim()}
          className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Registrando...' : 'Registrar caso externo'}
        </button>
      </form>

      <section className="w-full max-w-3xl mt-4">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Casos externos recientes
        </h2>
        {externalTransactions.length === 0 ? (
          <p className="text-center text-gray-600">Sin casos externos registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {externalTransactions.map((transaction, index) => (
              <li key={transaction.transactionId ?? transaction.id + index}>
                <TransactionCard transaction={transaction} showImg />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
