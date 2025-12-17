export interface UserData {
  name: string;
  role: string;
  phone: string;
  website: string;
  photoUrl: string | null;
  photoScale: number;
  photoX: number;
  photoY: number;
  showQrCode: boolean;
}

export interface AdminData {
  bannerUrl: string | null;
}

export const DEFAULT_USER_DATA: UserData = {
  name: '',
  role: '',
  phone: '',
  website: 'www.metarh.com.br',
  photoUrl: null,
  photoScale: 1,
  photoX: 0,
  photoY: 0,
  showQrCode: true,
};
