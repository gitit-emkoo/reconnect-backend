export function getPartnerId(user: any): string | undefined {
  return user?.partnerId || user?.partner?.id;
} 