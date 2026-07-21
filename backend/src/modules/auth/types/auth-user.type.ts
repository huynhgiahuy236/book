export type AuthUser = {
  sub: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
};
