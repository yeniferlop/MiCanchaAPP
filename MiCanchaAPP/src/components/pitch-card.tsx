import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Cancha } from '@/lib/types';
import { MapPin, CircleDollarSign, Users, ArrowRight } from 'lucide-react';

interface PitchCardProps {
  pitch: Cancha;
}

export function PitchCard({ pitch }: PitchCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={pitch.imageUrl}
            alt={pitch.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold mb-2 truncate">{pitch.name}</CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{pitch.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            <span>${pitch.hourlyRate}/hora</span>
          </div>
           <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>{pitch.type}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full font-semibold">
          <Link href={`/pitches/${pitch.id}`}>
            Ver Disponibilidad
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
