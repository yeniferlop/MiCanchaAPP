import type { Booking } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
    const imageData = PlaceHolderImages.find(p => p.id === id);
    return {
        url: imageData?.imageUrl ?? 'https://picsum.photos/seed/default/600/400',
        hint: imageData?.imageHint ?? 'image'
    };
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);


export const bookings: Booking[] = [
  {
    id: 'b1',
    pitchId: 'p1',
    pitchName: 'Cancha "El Campeón"',
    pitchImage: getImage('pitch-1').url,
    pitchImageHint: getImage('pitch-1').hint,
    userId: 'u1',
    date: tomorrow,
    startTime: '19:00',
    endTime: '20:00',
    status: 'confirmed',
  },
  {
    id: 'b2',
    pitchId: 'p5',
    pitchName: 'Rooftop Soccer Baires',
    pitchImage: getImage('pitch-5').url,
    pitchImageHint: getImage('pitch-5').hint,
    userId: 'u1',
    date: nextWeek,
    startTime: '21:00',
    endTime: '22:00',
    status: 'confirmed',
  },
  {
    id: 'b3',
    pitchId: 'p2',
    pitchName: 'Fútbol Indoor Center',
    pitchImage: getImage('pitch-2').url,
    pitchImageHint: getImage('pitch-2').hint,
    userId: 'u1',
    date: lastWeek,
    startTime: '18:00',
    endTime: '19:00',
    status: 'past',
  },
    {
    id: 'b4',
    pitchId: 'p4',
    pitchName: 'Complejo Deportivo Oeste',
    pitchImage: getImage('pitch-4').url,
    pitchImageHint: getImage('pitch-4').hint,
    userId: 'u1',
    date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    startTime: '15:00',
    endTime: '16:00',
    status: 'cancelled',
  },
];

export const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
export const pastBookings = bookings.filter(b => b.status === 'past' || b.status === 'cancelled');

export const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];
