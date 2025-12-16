export interface UserData {
  name: string;
  role: string;
  phone: string;
  website: string;
  photoUrl: string | null;
  photoScale: number;
  photoX: number;
  photoY: number;
}

export interface AdminData {
  bannerUrl: string | null;
}

export const DEFAULT_USER_DATA: UserData = {
  name: 'Rodrigo Aquino',
  role: 'Marketing',
  phone: '11 99648-6816',
  website: 'www.metarh.com.br',
  photoUrl: null,
  photoScale: 1,
  photoX: 0,
  photoY: 0,
};
