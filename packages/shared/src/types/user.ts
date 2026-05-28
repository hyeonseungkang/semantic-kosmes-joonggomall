export type UserRole = 'buyer' | 'seller' | 'admin';

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}
