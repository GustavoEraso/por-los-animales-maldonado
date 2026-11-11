'use client';

import { useEffect, useState } from 'react';
import { SponsorType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData, removeUndefinedDeep } from '@/lib/firebase/postFirestoreData';
import { useRouter } from 'next/navigation';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import Loader from '@/components/Loader';
import { getChangedFields, getChangedFieldsWithValues } from '@/lib/getChangedFields';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { hasSponsorCardContent } from '@/lib/sponsorCard';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import ReturnButton from '@/components/ReturnButton';
import SponsorCard from '@/components/SponsorCard';
import SponsorDonationsToggle from '../../components/SponsorDonationsToggle';
import SponsorSectionsEditor from '../../components/SponsorSectionsEditor';
import SponsorLinkField from '../../components/SponsorLinkField';
import {
  buildSectionsFromLegacyContent,
  cleanSponsorSections,
  normalizeSponsorSections,
  validateSponsorSections,
} from '../../components/sponsorSections';
import { normalizeWhatsAppNumber, resolveSponsorHref } from '@/lib/sponsorLink';
import { revalidateCache } from '@/lib/revalidateCache';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { auth } from '@/firebase';

const initialSponsor: SponsorType = {
  id: '',
  name: '',
  href: '',
  logoWidth: 100,
  showInDonations: false,
  sections: [],
  image: { imgId: '', imgUrl: '', imgAlt: '' },
};

interface SponsorEditClientPageProps {
  sponsorId: string;
}

/**
 * Admin page for editing an existing sponsor.
 * Fetches sponsor data by ID and allows updating name, link, and logo image.
 *
 * @param props - Resolved dynamic route parameters
 * @returns The interactive sponsor edit form
 */
export default function SponsorEditClientPage({
  sponsorId,
}: SponsorEditClientPageProps): React.ReactElement {
  const router = useRouter();
  const currentId = sponsorId;

  const [isLoading, setIsLoading] = useState(true);
  const MIN_LOADING_TIME = 600;

  const [oldSponsor, setOldSponsor] = useState<SponsorType>(initialSponsor);
  const [sponsor, setSponsor] = useState<SponsorType>(initialSponsor);
  const hasUnsavedChanges =
    Object.keys(getChangedFields({ oldObj: oldSponsor, newObj: sponsor })).length > 0;
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    const start = Date.now();
    const fetchSponsorData = async () => {
      try {
        if (!currentId) return;
        const fetched = await getFirestoreDocById<SponsorType>({
          currentCollection: 'sponsors',
          id: currentId,
        });
        if (!fetched) {
          logger({ level: 'error', code: 'SPONSOR_NOT_FOUND', message: 'Sponsor not found' });
          throw new Error('Sponsor not found');
        }
        const hasStoredSections = (fetched.sections?.length ?? 0) > 0;
        const normalizedSponsor: SponsorType = {
          ...fetched,
          logoWidth: fetched.logoWidth ?? 100,
          showInDonations: fetched.showInDonations ?? hasSponsorCardContent(fetched),
          sections: hasStoredSections
            ? normalizeSponsorSections(fetched.sections)
            : buildSectionsFromLegacyContent(fetched),
        };
        setOldSponsor(structuredClone(normalizedSponsor));
        setSponsor(normalizedSponsor);
      } catch (error) {
        logger({
          level: 'error',
          code: 'FETCH_SPONSOR_ERROR',
          message: 'Error fetching sponsor data:',
          data: error,
        });
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Hubo un error al obtener los datos del sponsor',
        });
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setIsLoading(false), remaining);
        } else {
          setIsLoading(false);
        }
      }
    };
    fetchSponsorData();
  }, [currentId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSponsor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sponsor.image.imgUrl) {
      return handleToast({ type: 'warning', title: 'Error', text: 'No se subió ninguna imagen.' });
    }

    if (!sponsor.name.trim()) {
      return handleToast({ type: 'warning', title: 'Error', text: 'El nombre es requerido.' });
    }

    if (sponsor.linkType === 'whatsapp' && !normalizeWhatsAppNumber(sponsor.whatsappNumber)) {
      return handleToast({
        type: 'warning',
        title: 'WhatsApp incompleto',
        text: 'Ingresá el número de WhatsApp o volvé al modo URL.',
      });
    }

    const sectionsError = validateSponsorSections(sponsor.sections ?? []);
    if (sectionsError) {
      return handleToast({
        type: 'warning',
        title: 'Revisá las secciones',
        text: sectionsError,
      });
    }

    const cleanedSponsor: SponsorType = {
      ...sponsor,
      href: resolveSponsorHref(sponsor),
      whatsappNumber:
        sponsor.linkType === 'whatsapp' ? normalizeWhatsAppNumber(sponsor.whatsappNumber) : '',
      description: sponsor.description ? '' : sponsor.description,
      linkLabel: sponsor.linkLabel ? '' : sponsor.linkLabel,
      image: {
        ...sponsor.image,
        imgAlt: sponsor.name.trim() ? `Logo de ${sponsor.name.trim()}` : sponsor.image.imgAlt,
      },
      sections: cleanSponsorSections(sponsor.sections ?? []),
    };

    const changesWithValues = getChangedFieldsWithValues({
      oldObj: oldSponsor,
      newObj: cleanedSponsor,
    });
    if (Object.keys(changesWithValues.after).length === 0) {
      handleToast({
        type: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios para guardar.',
      });
      return;
    }

    try {
      const auditChanges = removeUndefinedDeep({
        before: Object.fromEntries(Object.entries(changesWithValues.before)),
        after: Object.fromEntries(Object.entries(changesWithValues.after)),
      });

      await createAuditLog({
        type: 'sponsor',
        action: 'update',
        entityId: currentId,
        entityName: cleanedSponsor.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: auditChanges,
      });
      await handlePromiseToast(
        postFirestoreData<SponsorType>({
          data: cleanedSponsor,
          currentCollection: 'sponsors',
          id: cleanedSponsor.id,
        }),
        {
          messages: {
            pending: { title: 'Guardando cambios...', text: 'Por favor espera...' },
            success: {
              title: 'Sponsor actualizado',
              text: 'Los cambios se guardaron correctamente',
            },
            error: { title: 'Error', text: 'Hubo un error al guardar los cambios' },
          },
        }
      );

      await revalidateCache('sponsors');
      router.replace('/plam-admin/sponsors');
    } catch (error) {
      logger({
        level: 'error',
        code: 'UPDATE_SPONSOR_ERROR',
        message: 'Error al actualizar el sponsor:',
        data: error,
      });
    }
  };

  const handleImageDelete = async (imgId: string) => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: { title: 'Eliminando imagen...', text: 'Por favor espera...' },
        success: { title: 'Imagen eliminada', text: 'La imagen fue eliminada exitosamente' },
        error: { title: 'Error', text: 'Hubo un error al eliminar la imagen' },
      },
    });
    setSponsor((prev) => ({ ...prev, image: { imgId: '', imgUrl: '', imgAlt: '' } }));
  };

  if (isLoading) return <Loader />;

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <ReturnButton />
        <h1 className="text-4xl font-bold">Editar Sponsor</h1>
        <p>Modificá los datos del sponsor. El contenido de la tarjeta se arma con secciones.</p>
        <div className="grid gap-8 w-full max-w-5xl lg:grid-cols-2 items-start">
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-semibold">
                  Logo <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500">
                  Subí y recortá el logo del colaborador. Se recomienda una imagen con fondo
                  transparente.
                </p>
              </div>

              <section className="w-full flex flex-wrap gap-4 items-center justify-center">
                {sponsor.image.imgUrl ? (
                  <div className="relative flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleImageDelete(sponsor.image.imgId)}
                      className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow z-10"
                    >
                      ✕
                    </button>
                    <Image
                      src={sponsor.image.imgUrl}
                      alt={sponsor.image.imgAlt}
                      width={200}
                      height={200}
                      className="object-contain rounded-lg border"
                    />
                  </div>
                ) : (
                  <UploadImages
                    currentFolder="sponsor"
                    maxFiles={1}
                    enableCropping
                    onImagesAdd={(imgs) => {
                      if (imgs[0]) {
                        setSponsor((prev) => ({
                          ...prev,
                          image: { ...imgs[0], imgAlt: `${prev.name || 'sponsor'} logo` },
                        }));
                      }
                    }}
                  />
                )}
              </section>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="font-semibold">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={sponsor.name}
                onChange={handleChange}
                placeholder="Ej: Raciones La Coronilla"
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            <SponsorLinkField
              idPrefix="sponsor-link"
              label="Link del sponsor (opcional)"
              href={sponsor.href ?? ''}
              linkType={sponsor.linkType}
              whatsappNumber={sponsor.whatsappNumber}
              onChange={(values) => setSponsor((prev) => ({ ...prev, ...values }))}
              helperText="Se usa en los carruseles de logos. Los botones de la tarjeta se agregan en las secciones."
            />

            <SponsorDonationsToggle
              checked={sponsor.showInDonations ?? false}
              onChange={(checked) => setSponsor((prev) => ({ ...prev, showInDonations: checked }))}
            />

            {sponsor.showInDonations && (
              <div className="flex flex-col gap-1">
                <label htmlFor="logoWidth" className="font-semibold">
                  Tamaño del logo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="logoWidth"
                    name="logoWidth"
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={sponsor.logoWidth ?? 100}
                    onChange={(event) =>
                      setSponsor((prev) => ({ ...prev, logoWidth: Number(event.target.value) }))
                    }
                    aria-describedby="logo-width-help"
                    className="w-full accent-green-forest"
                  />
                  <span
                    aria-hidden="true"
                    className="w-12 shrink-0 text-right text-sm font-semibold text-green-dark"
                  >
                    {sponsor.logoWidth ?? 100}%
                  </span>
                </div>
                <p id="logo-width-help" className="text-xs text-gray-500">
                  Ajustá el ancho del logo dentro de la tarjeta. 100% ocupa todo el ancho
                  disponible.
                </p>
              </div>
            )}

            <SponsorSectionsEditor
              sections={sponsor.sections ?? []}
              onChange={(sections) => setSponsor((prev) => ({ ...prev, sections }))}
            />

            <button
              type="submit"
              className="bg-green-forest text-white px-6 py-3 rounded-lg hover:bg-green-dark transition-colors font-semibold"
            >
              Guardar cambios
            </button>
          </form>

          <aside className="flex flex-col gap-3 w-full lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-3">
            <div>
              <h2 className="text-xl font-bold text-green-dark">Vista previa en Donaciones</h2>
              <p className="text-sm text-gray-500">
                {sponsor.showInDonations
                  ? 'Así se verá la tarjeta con los datos que estás editando.'
                  : 'La tarjeta no se mostrará en Donaciones.'}
              </p>
            </div>
            {sponsor.showInDonations ? (
              <>
                <SponsorCard sponsor={sponsor} preview />
                <p className="text-xs text-gray-400">
                  La tarjeta se publica si agregás al menos una sección con contenido. El link del
                  sponsor se usa en los carruseles de logos.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Activá &quot;Mostrar en Donaciones&quot; para ver la vista previa de la tarjeta.
              </div>
            )}
          </aside>
        </div>
      </section>
    </ProtectedRoute>
  );
}
