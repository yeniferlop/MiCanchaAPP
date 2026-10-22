'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Search as SearchIcon, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface Cancha {
  id: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  precio: number;
  image?: string;
  estado: string;
  tipo: string;
}

// Componente de tarjeta SIMPLE que SÍ funciona
function CanchaCard({ cancha }: { cancha: Cancha }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{cancha.nombre}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            cancha.estado === 'disponible'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {cancha.estado}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {cancha.descripcion}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{cancha.ubicacion}</span>
          </div>

          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-bold text-green-600">
              ${cancha.precio?.toLocaleString('es-CO')}/hora
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" asChild>
          <a href={`/pitches/${cancha.id}`}>
            Ver detalles
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SearchPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    ubicacion: '',
    fecha: '',
    hora: ''
  });

  useEffect(() => {
    cargarCanchas();
  }, []);

  const cargarCanchas = async (params?: string) => {
    setIsLoading(true);
    try {
      const url = params
        ? `/api/canchas?${params}`
        : '/api/canchas';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar canchas');

      const data = await response.json();
      setCanchas(data);
    } catch (error) {
      console.error('Error:', error);
      setCanchas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buscarCanchas = async () => {
    const params = new URLSearchParams();

    if (filtros.ubicacion) params.append('ubicacion', filtros.ubicacion);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    if (filtros.hora) params.append('hora', filtros.hora);

    await cargarCanchas(params.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Formulario de búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-6">Encuentra tu cancha ideal</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ubicación */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Ej: Bolívar, Cauca"
                className="pl-10"
                name="ubicacion"
                value={filtros.ubicacion}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="date"
                name="fecha"
                value={filtros.fecha}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Horario</label>
            <Select
              value={filtros.hora}
              onValueChange={(value) => setFiltros({...filtros, hora: value})}
            >
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Cualquier hora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mañana">Mañana (6:00 - 12:00)</SelectItem>
                <SelectItem value="tarde">Tarde (12:00 - 18:00)</SelectItem>
                <SelectItem value="noche">Noche (18:00 - 22:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón Buscar */}
          <div className="flex items-end">
            <Button
              onClick={buscarCanchas}
              className="w-full h-10"
              disabled={isLoading}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div>
        <h2 className="text-xl font-semibold mb-6">
          {canchas.length} {canchas.length === 1 ? 'Cancha Disponible' : 'Canchas Disponibles'}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : canchas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {canchas.map((cancha) => (
              <CanchaCard key={cancha.id} cancha={cancha} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No se encontraron canchas con los filtros aplicados
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFiltros({ ubicacion: '', fecha: '', hora: '' });
                cargarCanchas();
              }}
            >
              Mostrar todas las canchas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}