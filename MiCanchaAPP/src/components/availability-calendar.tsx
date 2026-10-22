'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import { timeSlots } from '@/lib/placeholder-data';
import type { Cancha, Horario } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const daysOfWeekEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const daysOfWeekSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AvailabilityCalendar({ pitch }: { pitch: Cancha }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const selectedDayName = date ? daysOfWeekSpanish[date.getDay()] : '';

  const horariosQuery = useMemoFirebase(
    () =>
      date
        ? query(
            collection(firestore, `canchas/${pitch.id}/horarios`),
            where('dayOfWeek', '==', selectedDayName)
          )
        : null,
    [firestore, pitch.id, date, selectedDayName]
  );

  const { data: horarios, isLoading } = useCollection<Horario>(horariosQuery);

  const handleBooking = () => {
     if (!selectedSlot || !date) return;
     setIsConfirming(true);
  }

  const confirmBooking = () => {
    // Here you would typically call an API to create the booking and handle payment
    console.log(`Booking confirmed for ${pitch.name} on ${date?.toLocaleDateString()} at ${selectedSlot}`);

    toast({
      title: "¡Reserva Exitosa!",
      description: `Tu reserva en ${pitch.name} para el ${date?.toLocaleDateString('es-ES')} a las ${selectedSlot} ha sido confirmada.`,
      action: <CheckCircle className="text-green-500" />,
    });

    setIsConfirming(false);
    setSelectedSlot(null);
  }

  const availableSlots = React.useMemo(() => {
    if (!horarios) return new Set<string>();
    return new Set(horarios.filter(h => h.isAvailable).map(h => h.startTime));
  }, [horarios]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reservar Cancha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
              locale={es}
            />
          </div>
          {date && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Horarios Disponibles para {format(date, 'eeee d', { locale: es})}
              </h3>
              {isLoading ? <p>Cargando horarios...</p> : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isAvailable = availableSlots.has(slot);
                    return (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          !isAvailable && "text-muted-foreground/50 line-through",
                        )}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full font-bold"
            disabled={!selectedSlot}
            onClick={handleBooking}
          >
            Reservar por ${pitch.hourlyRate}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar tu reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de reservar <strong>{pitch.name}</strong> para el <strong>{date?.toLocaleDateString('es-ES')}</strong> de <strong>{selectedSlot}</strong> a {selectedSlot && `${parseInt(selectedSlot.split(':')[0]) + 1}:00`}.
              <br/>
              El precio total es <strong>${pitch.hourlyRate}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBooking}>
              Confirmar y Pagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
