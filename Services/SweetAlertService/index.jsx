import Swal from 'sweetalert2';

// Theme Constants
const COLORS = {
  primary: '#004d40', // Bottle Green
  accent: '#2ecc71',  // Emerald Green
  danger: '#e74c3c',
  warning: '#f1c40f'
};

/**
 * SUCCESS ALERT
 * Used for: Data saved, Login successful, etc.
 */
export const alertSuccess = (title, text = "") => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: COLORS.primary,
    iconColor: COLORS.accent,
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * ERROR ALERT
 * Used for: API failures, Validation errors.
 */
export const alertError = (title, text = "Something went wrong!") => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: COLORS.primary,
  });
};

/**
 * WARNING ALERT
 * Used for: Simple warnings that don't require confirmation.
 */
export const alertWarning = (title, text = "") => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonColor: COLORS.primary,
  });
};

/**
 * CONFIRMATION DIALOG (Async)
 * Used for: Deleting a course, Logging out.
 * Returns true if confirmed, false otherwise.
 */
export const alertConfirm = async (title, text = "You won't be able to revert this!") => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: COLORS.primary,
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    reverseButtons: true // Modern look: Cancel on left, Confirm on right
  });

  return result.isConfirmed;
};

/**
 * TOAST NOTIFICATION
 * Top-right small alerts that don't block the UI.
 */
export const alertToast = (title, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon: icon,
    title: title
  });
};