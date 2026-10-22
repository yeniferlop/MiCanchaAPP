export interface Cancha {
  id: string;
  name: string;
  location: string;
  description: string;
  type: '5-a-side' | '7-a-side' | '11-a-side';
  hourlyRate: number;
  imageUrl: string;
}

export interface Horario {
  id: string;
  canchaId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  pitchId: string;
  pitchName: string;
  pitchImage: string;
  pitchImageHint: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'past';
}
