import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Tag, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingCardProps {
  booking: Booking;
}

const statusVariant = {
  confirmed: 'default',
  cancelled: 'destructive',
  past: 'secondary',
} as const;

const statusText = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  past: 'Finalizada',
};

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
          <Image
            src={booking.pitchImage}
            alt={booking.pitchName}
            fill
            className="object-cover"
            data-ai-hint={booking.pitchImageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold mb-2">{booking.pitchName}</h3>
            <Badge variant={statusVariant[booking.status]}>{statusText[booking.status]}</Badge>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="capitalize">{format(booking.date, "eeee, d 'de' MMMM", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0" />
            <span>ID Reserva: {booking.id.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
      {booking.status === 'confirmed' && (
        <CardFooter className="p-4 pt-0">
          <Button variant="destructive" className="w-full">
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Reserva
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
