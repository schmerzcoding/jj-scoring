export const MIN_PASSWORD_LENGTH = 6;

export function validateMinPasswordLength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validatePasswordsMatch(
  password: string,
  confirmPassword: string
): string | null {
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

export function validateNewPasswordDifferent(
  currentPassword: string,
  newPassword: string
): string | null {
  if (currentPassword === newPassword) {
    return "New password must be different from your current password.";
  }
  return null;
}

export function validatePasswordPair(
  password: string,
  confirmPassword: string
): string | null {
  return (
    validateMinPasswordLength(password) ??
    validatePasswordsMatch(password, confirmPassword)
  );
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): string | null {
  return (
    validateMinPasswordLength(newPassword) ??
    validatePasswordsMatch(newPassword, confirmPassword) ??
    validateNewPasswordDifferent(currentPassword, newPassword)
  );
}
