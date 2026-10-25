export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

export function getAuthErrorMessage(
  error: any,
  defaultMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!error) return defaultMessage;

  const code = typeof error === 'string' ? error : error?.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 8 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'Please log out and log back in to perform this action.';
    default:
      return typeof error?.message === 'string'
        ? error.message.replace(/^Firebase:\s*/, '')
        : defaultMessage;
  }
}
