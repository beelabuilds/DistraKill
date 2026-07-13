export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}
