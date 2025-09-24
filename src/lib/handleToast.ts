import { toast, ToastOptions } from 'react-toastify';
import ToastMsg from '@/elements/ToastMsg';

type TypeProps = 'info' | 'success' | 'error' | 'warning';

/**
 * Configuration object for basic toast notifications.
 */
interface Props {
  /** Toast type that determines the color scheme and default icon */
  type: TypeProps;
  /** Main heading text displayed in the toast notification */
  title: string;
  /** Descriptive message text shown below the title */
  text: string;
  /**
   * Toast position on screen
   * @default 'bottom-right'
   */
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
  /**
   * Auto close delay in milliseconds, or false to disable auto close
   * @default 5000
   */
  autoClose?: number | false;
  /**
   * Whether to hide the progress bar
   * @default false
   */
  hideProgressBar?: boolean;
  /**
   * Whether clicking the toast closes it
   * @default true
   */
  closeOnClick?: boolean;
  /**
   * Whether hovering pauses the auto close timer
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Whether the toast can be dragged by the user
   * @default true
   */
  draggable?: boolean;
  /**
   * Toast theme override (defaults based on type)
   * - 'light': Light background with dark text
   * - 'dark': Dark background with light text
   * - 'colored': Colored background based on toast type
   * @default type-specific theme
   */
  theme?: 'light' | 'dark' | 'colored';
}

/**
 * Messages configuration for each promise state in promise-based toasts.
 */
interface PromiseToastMessages {
  /** Message displayed while promise is pending */
  pending: {
    /** Title for pending state */
    title: string;
    /** Description text for pending state */
    text: string;
  };
  /** Message displayed when promise resolves successfully */
  success: {
    /** Title for success state */
    title: string;
    /** Description text for success state */
    text: string;
  };
  /** Message displayed when promise rejects/fails */
  error: {
    /** Title for error state */
    title: string;
    /** Description text for error state */
    text: string;
  };
}

/**
 * Configuration object for promise-based toast notifications.
 */
interface PromiseToastOptions {
  /** Messages for each promise state (pending, success, error) */
  messages: PromiseToastMessages;
  /**
   * Toast position on screen
   * @default 'bottom-right'
   */
  position?: Props['position'];
  /**
   * Auto close delay in milliseconds, or false to disable auto close
   * @default 5000
   */
  autoClose?: number | false;
  /**
   * Whether to hide the progress bar
   * @default false
   */
  hideProgressBar?: boolean;
  /**
   * Whether clicking the toast closes it
   * @default true
   */
  closeOnClick?: boolean;
  /**
   * Whether hovering pauses the auto close timer
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Whether the toast can be dragged by the user
   * @default true
   */
  draggable?: boolean;
  /**
   * Toast theme override
   * - 'light': Light background with dark text
   * - 'dark': Dark background with light text
   * - 'colored': Colored background based on toast type
   * @default 'light'
   */
  theme?: 'light' | 'dark' | 'colored';
}

/**
 * Displays a custom toast notification using react-toastify with consistent styling and custom icons.
 *
 * This function creates toast notifications with customizable content and icons. The ToastMsg component
 * receives the type information through the data object to display the appropriate icon:
 * - 'info': Shows hueso-200.webp (bone icon)
 * - 'success': Shows logo300.webp (organization logo)
 * - 'warning': Shows warn.webp (warning icon)
 * - 'error': Shows error.webp (error icon)
 *
 * @param {Object} props - Configuration object for the toast notification.
 * @param {'info'|'success'|'error'|'warning'} props.type - Toast type that determines both react-toastify styling and custom icon display.
 * @param {string} props.title - Main heading text displayed in the toast notification.
 * @param {string} props.text - Descriptive message text shown below the title.
 * @param {'top-right'|'top-center'|'top-left'|'bottom-right'|'bottom-center'|'bottom-left'} [props.position='bottom-right'] - Toast position on screen.
 * @param {number|false} [props.autoClose=5000] - Auto close delay in milliseconds, or false to disable auto close.
 * @param {boolean} [props.hideProgressBar=false] - Whether to hide the progress bar.
 * @param {boolean} [props.closeOnClick=true] - Whether clicking the toast closes it.
 * @param {boolean} [props.pauseOnHover=true] - Whether hovering pauses the auto close timer.
 * @param {boolean} [props.draggable=true] - Whether the toast can be dragged by the user.
 * @param {'light'|'dark'|'colored'} [props.theme] - Toast theme override (defaults based on type).
 *
 * @returns {void} This function does not return a value; it triggers the toast display.
 *
 * @example
 * // Display an info notification with bone icon
 * handleToast({
 *   type: 'info',
 *   title: 'Information',
 *   text: 'Your session will expire in 5 minutes.'
 * });
 * // Result: Shows hueso-200.webp icon with light blue toast styling
 *
 * @example
 * // Display a success notification with organization logo
 * handleToast({
 *   type: 'success',
 *   title: 'Animal Saved',
 *   text: 'The animal profile has been successfully updated in the database.'
 * });
 * // Result: Shows logo300.webp icon with green toast styling
 *
 * @example
 * // Show a persistent error notification
 * handleToast({
 *   type: 'error',
 *   title: 'Save Failed',
 *   text: 'Unable to save animal data. Please check your connection and try again.',
 *   autoClose: false,
 *   position: 'top-center'
 * });
 * // Result: Shows error.webp icon with red toast styling that doesn't auto-close
 *
 * @example
 * // Display a warning with custom timing and theme
 * handleToast({
 *   type: 'warning',
 *   title: 'Missing Information',
 *   text: 'Please fill in all required fields before submitting the form.',
 *   autoClose: 10000,
 *   theme: 'dark',
 *   pauseOnHover: false
 * });
 * // Result: Shows warn.webp icon with dark theme warning toast
 */
export function handleToast({
  type,
  title,
  text,
  position = 'bottom-right',
  autoClose = 5000,
  hideProgressBar = false,
  closeOnClick = true,
  pauseOnHover = true,
  draggable = true,
  theme,
}: Props): void {
  const baseOptions: ToastOptions & { data: { title: string; text: string; type: TypeProps } } = {
    draggable,
    position,
    autoClose,
    hideProgressBar,
    closeOnClick,
    pauseOnHover,
    data: { title: title, text: text, type: type },
  };

  // Apply theme if provided, otherwise use type-specific defaults
  const finalOptions = theme ? { ...baseOptions, theme } : baseOptions;

  switch (type) {
    case 'info':
      toast.info(ToastMsg, { ...finalOptions, theme: theme || 'light', icon: false });
      break;
    case 'success':
      toast.success(ToastMsg, finalOptions);
      break;
    case 'error':
      toast.error(ToastMsg, finalOptions);
      break;
    case 'warning':
      toast.warn(ToastMsg, finalOptions);
      break;

    default:
      break;
  }
}

/**
 * Handles promise-based operations with automatic toast state management and custom icons.
 *
 * Shows a loading toast while the promise is pending, then automatically updates to
 * success or error based on the promise result. Each state displays the appropriate custom icon:
 * - Pending state: No icon (can be customized by adding type to pending message)
 * - Success state: Shows logo300.webp (organization logo)
 * - Error state: Shows error.webp (error icon)
 *
 * Perfect for async operations like API calls, file uploads, or database operations.
 *
 * @param {Promise<any>} promise - The promise to track and display status for.
 * @param {Object} options - Configuration for the promise toast.
 * @param {PromiseToastMessages} options.messages - Messages for each promise state (pending, success, error).
 * @param {'top-right'|'top-center'|'top-left'|'bottom-right'|'bottom-center'|'bottom-left'} [options.position='bottom-right'] - Toast position.
 * @param {number|false} [options.autoClose=5000] - Auto close delay, or false to disable.
 * @param {boolean} [options.hideProgressBar=false] - Whether to hide the progress bar.
 * @param {boolean} [options.closeOnClick=true] - Whether clicking closes the toast.
 * @param {boolean} [options.pauseOnHover=true] - Whether hovering pauses auto close.
 * @param {boolean} [options.draggable=true] - Whether the toast is draggable.
 * @param {'light'|'dark'|'colored'} [options.theme] - Toast theme.
 *
 * @returns {Promise<any>} Returns the original promise for chaining.
 *
 * @example
 * // Handle an animal save operation with custom icons
 * const savePromise = saveAnimalToDatabase(animalData);
 * handlePromiseToast(savePromise, {
 *   messages: {
 *     pending: {
 *       title: 'Saving Animal',
 *       text: 'Please wait while we save the animal data...'
 *     },
 *     success: {
 *       title: 'Animal Saved!',
 *       text: 'The animal profile has been successfully saved to the database.'
 *     },
 *     error: {
 *       title: 'Save Failed',
 *       text: 'Unable to save animal data. Please try again.'
 *     }
 *   }
 * });
 * // Result: Pending shows no icon, success shows logo300.webp, error shows error.webp
 *
 * @example
 * // Handle image upload with enhanced user feedback
 * const uploadPromise = uploadImage(imageFile);
 * handlePromiseToast(uploadPromise, {
 *   messages: {
 *     pending: {
 *       title: 'Uploading Image',
 *       text: 'Uploading image to server...'
 *     },
 *     success: {
 *       title: 'Upload Complete',
 *       text: 'Image uploaded successfully!'
 *     },
 *     error: {
 *       title: 'Upload Failed',
 *       text: 'Failed to upload image. Check file size and format.'
 *     }
 *   },
 *   position: 'top-center',
 *   autoClose: 3000,
 *   theme: 'colored'
 * });
 * // Result: Visual feedback throughout the entire upload process with custom icons
 */
export function handlePromiseToast<T>(
  promise: Promise<T>,
  options: PromiseToastOptions
): Promise<T> {
  const {
    messages,
    position = 'bottom-right',
    autoClose = 5000,
    hideProgressBar = false,
    closeOnClick = true,
    pauseOnHover = true,
    draggable = true,
    theme,
  } = options;

  const toastOptions: ToastOptions = {
    position,
    autoClose,
    hideProgressBar,
    closeOnClick,
    pauseOnHover,
    draggable,
    ...(theme && { theme }),
  };

  const promiseConfig = {
    pending: {
      render: ToastMsg,
      data: {
        // Note: No type specified for pending state, so no icon will be displayed
        title: messages.pending.title,
        text: messages.pending.text,
      },
    },
    success: {
      render: ToastMsg,
      data: {
        type: 'success' as TypeProps,
        title: messages.success.title,
        text: messages.success.text,
      },
    },
    error: {
      render: ToastMsg,
      data: {
        type: 'error' as TypeProps,
        title: messages.error.title,
        text: messages.error.text,
      },
    },
  };

  // Use toast.promise with type assertion for flexibility
  (toast.promise as any)(promise, promiseConfig, toastOptions);

  // Return the original promise for chaining
  return promise;
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

=== BASIC TOAST NOTIFICATIONS WITH CUSTOM ICONS ===

1) Info notification with bone icon
   handleToast({
     type: 'info',
     title: 'Session Info',
     text: 'Your session will expire in 5 minutes. Save your work.'
   });
   // Result: Shows hueso-200.webp (bone icon) with light blue toast styling

2) Success notification with organization logo
   handleToast({
     type: 'success',
     title: 'Animal Saved',
     text: 'The animal profile has been successfully updated in the database.'
   });
   // Result: Shows logo300.webp (organization logo) with green toast styling

3) Warning notification with warning icon
   handleToast({
     type: 'warning',
     title: 'Session Expiring',
     text: 'Your session will expire in 2 minutes. Please save your work.',
     autoClose: 10000,
     theme: 'dark',
     pauseOnHover: false,
     position: 'top-right'
   });
   // Result: Shows warn.webp (warning icon) with dark theme warning toast

4) Error notification with error icon that doesn't auto-close
   handleToast({
     type: 'error',
     title: 'Critical Error',
     text: 'Database connection failed. Please contact system administrator.',
     autoClose: false,
     position: 'top-center'
   });
   // Result: Shows error.webp (error icon) with red toast that stays until manually closed

=== PROMISE-BASED NOTIFICATIONS WITH VISUAL FEEDBACK ===

5) Database save operation with complete visual feedback
   const saveAnimal = async (data) => {
     const response = await fetch('/api/animals', {
       method: 'POST',
       body: JSON.stringify(data)
     });
     if (!response.ok) throw new Error('Save failed');
     return response.json();
   };

   handlePromiseToast(saveAnimal(animalData), {
     messages: {
       pending: {
         title: 'Saving Animal',
         text: 'Please wait while we save the animal to the database...'
       },
       success: {
         title: 'Animal Saved!',
         text: 'The animal profile has been successfully saved.'
       },
       error: {
         title: 'Save Failed',
         text: 'Unable to save animal data. Please try again.'
       }
     },
     autoClose: 3000
   });
   // Result: Pending (no icon) → Success (logo300.webp) or Error (error.webp)

6) Image upload with enhanced user feedback and colored theme
   const uploadImage = async (file) => {
     await new Promise(resolve => setTimeout(resolve, 2000));
     if (file.size > 5000000) throw new Error('File too large');
     return { url: '/uploads/image.jpg' };
   };

   handlePromiseToast(uploadImage(imageFile), {
     messages: {
       pending: {
         title: 'Uploading Image',
         text: 'Uploading image to server, please wait...'
       },
       success: {
         title: 'Upload Complete',
         text: 'Image uploaded successfully!'
       },
       error: {
         title: 'Upload Failed',
         text: 'Failed to upload image. Check file size and try again.'
       }
     },
     position: 'top-center',
     theme: 'colored',
     autoClose: 4000
   });
   // Result: Visual progress with colored theme and custom icons for success/error states

7) Batch operations with detailed progress feedback
   const batchUpdateAnimals = async (animals) => {
     const results = await Promise.all(
       animals.map(animal => updateAnimal(animal))
     );
     return { updated: results.length, failed: 0 };
   };

   handlePromiseToast(batchUpdateAnimals(selectedAnimals), {
     messages: {
       pending: {
         title: 'Processing Batch',
         text: `Updating ${selectedAnimals.length} animal records...`
       },
       success: {
         title: 'Batch Complete',
         text: 'All animal records have been successfully updated.'
       },
       error: {
         title: 'Batch Failed',
         text: 'Some records could not be updated. Please check and retry.'
       }
     },
     autoClose: 5000,
     position: 'bottom-center',
     hideProgressBar: false
   });
   // Result: Comprehensive batch operation feedback with custom icons

=== ADVANCED CUSTOMIZATION EXAMPLES ===

8) Quick auto-save notification with minimal UI
   handleToast({
     type: 'info',
     title: 'Auto-saved',
     text: 'Draft saved automatically.',
     autoClose: 2000,
     hideProgressBar: true,
     closeOnClick: false,
     position: 'bottom-left'
   });
   // Result: Subtle bone icon notification that doesn't interrupt workflow

9) Persistent critical error with enhanced visibility
   handleToast({
     type: 'error',
     title: 'System Error',
     text: 'Critical system error detected. Please contact support immediately.',
     autoClose: false,
     theme: 'colored',
     position: 'top-center',
     draggable: false,
     closeOnClick: true
   });
   // Result: High-visibility error with error.webp icon that demands attention

──────────────────────────────────────────────────────────────────────────── */
