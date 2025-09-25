import { ToastContentProps } from 'react-toastify';

/**
 * Props interface for ToastMsg component extending react-toastify's ToastContentProps.
 */
interface MsgProps extends Partial<ToastContentProps> {
  /**
   * Optional data object containing the toast content
   * @default undefined
   */
  data?: {
    /** Title text displayed prominently in the toast */
    title: string;
    /** Descriptive text displayed below the title */
    text: string;
    /** Type of toast: 'success', 'error', 'warning', 'info' */
    type: 'success' | 'error' | 'warning' | 'info';
  };
}

/**
 * Custom toast message component that displays structured content with icons.
 *
 * This component renders toast notifications with custom styling, icons, and layout.
 * It displays different images based on the toast type from the data object and handles
 * the title/text content with consistent formatting and animations.
 *
 * @param {Object} props - Component props
 * @param {Object} [props.data] - Toast content data with title, text, and type
 * @param {string} [props.data.title=''] - Main heading text for the toast
 * @param {string} [props.data.text=''] - Descriptive text below the title
 * @param {'success'|'error'|'warning'|'info'} [props.data.type=''] - Toast type determining the icon to display
 *   - 'info': Shows hueso-200.webp icon (bone icon)
 *   - 'success': Shows logo300.webp icon (organization logo)
 *   - 'warning': Shows warn.webp icon (warning symbol)
 *   - 'error': Shows error.webp icon (error symbol)
 *   - Empty or other types: No icon displayed
 * @param {Object} props.toastProps - React-toastify props containing toast metadata
 *
 * @returns {React.ReactElement} The rendered toast message component
 *
 * @example
 * // Success toast with organization logo
 * toast.success(ToastMsg, {
 *   data: {
 *     type: 'success',
 *     title: 'Success!',
 *     text: 'Operation completed successfully'
 *   }
 * });
 *
 * @example
 * // Error toast with error icon
 * toast.error(ToastMsg, {
 *   data: {
 *     type: 'error',
 *     title: 'Error occurred',
 *     text: 'Please try again later'
 *   }
 * });
 *
 * @example
 * // Warning toast with warning icon
 * toast.warn(ToastMsg, {
 *   data: {
 *     type: 'warning',
 *     title: 'Warning',
 *     text: 'This action cannot be undone'
 *   }
 * });
 *
 * @example
 * // Info toast with bone icon
 * toast.info(ToastMsg, {
 *   data: {
 *     type: 'info',
 *     title: 'Information',
 *     text: 'Please wait while processing...'
 *   }
 * });
 */ export default function ToastMsg({ data }: MsgProps): React.ReactElement {
  const title = data?.title ?? '';
  const text = data?.text ?? '';
  const type = data?.type ?? '';
  return (
    <div className="msg-container flex flex-col items-center justify-center gap-2 p-4">
      <div className="flex items-center justify-center gap-1">
        {type === 'info' && (
          <img src="/hueso-200.webp" alt="imagen de éxito" className="w-20 h-20 object-contain" />
        )}
        {type === 'success' && (
          <img src="/logo300.webp" alt="imagen de éxito" className="w-20 h-20 object-contain" />
        )}
        {type === 'warning' && (
          <img src="/warn.webp" alt="imagen de advertencia" className="w-20 h-20 object-contain" />
        )}
        {type === 'error' && (
          <img src="/error.webp" alt="imagen de error" className="w-20 h-20 object-contain" />
        )}
        <h4 className="text-3xl font-bold text-center text-balance break-keep">{title}</h4>
      </div>
      <p className="animate-pulse">{text}</p>
    </div>
  );
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

=== TOAST MESSAGE COMPONENT WITH CUSTOM ICONS ===

1) Success toast with organization logo - Uses data.type to determine icon
   toast.success(ToastMsg, {
     data: { 
       type: 'success',
       title: 'Animal Saved!', 
       text: 'The animal profile has been successfully saved to the database.' 
     }
   });
   // Result: Displays logo300.webp icon (organization logo) with title and animated text

2) Error toast with error icon - Uses data.type for error icon
   toast.error(ToastMsg, {
     data: { 
       type: 'error',
       title: 'Save Failed', 
       text: 'Unable to save animal data. Please check your connection.' 
     }
   });
   // Result: Displays error.webp icon with title and animated text

3) Warning toast with warning icon - Uses data.type for warning icon
   toast.warn(ToastMsg, {
     data: { 
       type: 'warning',
       title: 'Missing Data', 
       text: 'Please fill in all required fields before submitting.' 
     }
   });
   // Result: Displays warn.webp icon with title and animated text

4) Info toast with bone icon - NEW: Uses hueso-200.webp for info type
   toast.info(ToastMsg, {
     data: { 
       type: 'info',
       title: 'Processing...', 
       text: 'Your request is being processed, please wait.' 
     }
   });
   // Result: Displays hueso-200.webp (bone icon) with title and animated text

5) Toast without type - No icon displayed
   toast.success(ToastMsg, {
     data: { 
       title: 'Simple Message', 
       text: 'This toast has no icon because type is not specified.' 
     }
   });
   // Result: Shows only title and text, no icon

6) Toast with minimal data - Component handles undefined gracefully
   toast.success(ToastMsg, {
     data: { type: 'success' }
   });
   // Result: Shows success icon with empty title and text

7) Long title with break-keep styling
   toast.success(ToastMsg, {
     data: { 
       type: 'success',
       title: 'Batch Operation Completed Successfully', 
       text: 'All 25 animal records have been updated with the new vaccination schedule and contact information.' 
     }
   });
   // Result: break-keep class ensures proper line breaking for long titles

=== INTEGRATION WITH TOAST HANDLERS ===

8) Used within handleToast function - Type must be passed in data
   handleToast({
     type: 'success',
     title: 'Upload Complete',
     text: 'Image uploaded successfully to the server.'
   });
   // Result: handleToast must pass type in data object for icon to display

9) Used within handlePromiseToast function - Each state needs type in data
   handlePromiseToast(uploadPromise, {
     messages: {
       pending: { title: 'Uploading...', text: 'Please wait...' },    // May need type: 'info'
       success: { title: 'Done!', text: 'Upload completed.' },        // May need type: 'success'
       error: { title: 'Failed', text: 'Upload failed.' }             // May need type: 'error'
     }
   });
   // Result: Icons only display if type is included in the message data

=== DIRECT JSX USAGE (NOT RECOMMENDED FOR NORMAL USE) ===

10) Manual component usage - Direct props passing
    <ToastMsg 
      data={{ 
        type: 'info',
        title: 'Test', 
        text: 'This is for testing only' 
      }}
      toastProps={{ type: 'success' }}
    />
    // Note: data.type is used for icon selection, not toastProps.type

──────────────────────────────────────────────────────────────────────────── */
