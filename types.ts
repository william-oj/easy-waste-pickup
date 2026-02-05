export enum AppView {
  HOME = 'home',
  REGULAR = 'regular',
  BULKY = 'bulky',
  REPORT = 'report',
  CHAT = 'chat',
  COLLECTOR = 'collector',
  MY_REQUESTS = 'my_requests',
  PROFILE = 'profile'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LocationData {
  address: string;
  lat?: number;
  lng?: number;
}
