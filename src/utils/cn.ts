type ClassValue = string | number | boolean | undefined | null | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  return (inputs as unknown[]).flat(Infinity).filter(Boolean).join(' ')
}
