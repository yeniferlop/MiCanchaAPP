'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PitchDetailPage({ params }: { params: { id: string } }) {
  const [cancha, setCancha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [creandoReserva, setCreandoReserva] = useState(false);
  const router = useRouter();

  // Horas disponibles
  const horas = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  // 1. Verificar usuario autenticado
  useEffect(() => {
    const usuarioStorage = localStorage.getItem('usuario');
    const token = localStorage.getItem('auth_token');

    if (usuarioStorage && token) {
      setUsuario(JSON.parse(usuarioStorage));
    } else {
      // Si no está autenticado, redirigir a login
      router.push('/login');
    }
  }, [router]);

  // 2. Cargar cancha desde backend
  useEffect(() => {
    const cargarCancha = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/canchas/${params.id}`);

        if (response.ok) {
          const data = await response.json();
          setCancha(data);
        } else {
          // Si falla, usar datos de prueba
          setCancha({
            id: params.id,
            nombre: `Cancha ${params.id}`,
            descripcion: 'Cancha profesional sintética',
            ubicacion: 'Ubicación de prueba',
            precio_hora: 50000,
            tipo: 'Sintética',
            capacidad: 12,
            estado: 'disponible'
          });
        }
      } catch (error) {
        console.error('Error cargando cancha:', error);
        // Datos de prueba
        setCancha({
          id: params.id,
          nombre: `Cancha ${params.id} - Estadio Local`,
          descripcion: 'Cancha profesional con iluminación LED y vestuarios.',
          ubicacion: 'Calle Principal #123, Ciudad',
          precio_hora: 50000,
          tipo: 'Sintética',
          capacidad: 12,
          estado: 'disponible'
        });
      } finally {
        setLoading(false);
      }
    };

    cargarCancha();
  }, [params.id]);

  // Función para crear reserva
  const crearReserva = async () => {
    if (!usuario || !cancha || !selectedDate || !selectedTime) return;

    setCreandoReserva(true);

    try {
      const token = localStorage.getItem('auth_token');
      const horaFin = `${parseInt(selectedTime.split(':')[0]) + 1}:00`;

      const reservaData = {
        cancha_id: cancha.id,
        fecha: selectedDate,
        hora_inicio: selectedTime,
        hora_fin: horaFin,
        usuario_id: usuario.id_usuario,
        monto_total: cancha.precio_hora
      };

      console.log('Enviando reserva:', reservaData);

      const response = await fetch('http://localhost:5000/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reservaData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reserva');
      }

      alert(`✅ ¡Reserva creada exitosamente!\n\nCancha: ${cancha.nombre}\nFecha: ${selectedDate}\nHora: ${selectedTime}\nPrecio: $${cancha.precio_hora.toLocaleString()}`);

      // Resetear formulario
      setSelectedDate('');
      setSelectedTime('');
      setStep('date');

    } catch (error: any) {
      console.error('Error creando reserva:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCreandoReserva(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Cargando cancha {params.id}...</h1>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>🔒 Acceso restringido</h1>
        <p>Debes iniciar sesión para ver esta página</p>
        <button
          onClick={() => router.push('/login')}
          style={{ marginTop: '20px', padding: '10px 20px', background: 'blue', color: 'white' }}
        >
          Ir a Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Barra superior */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', color: '#333', margin: 0 }}>
            {cancha.nombre}
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>📍 {cancha.ubicacion}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>👤 {usuario.nombre}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>{usuario.correo}</p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('usuario');
              router.push('/login');
            }}
            style={{
              marginTop: '10px',
              padding: '5px 15px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Información de la cancha */}
        <div>
          <div style={{
            background: '#fff',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Descripción</h2>
            <p style={{ color: '#555', lineHeight: '1.6' }}>{cancha.descripcion}</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
              marginTop: '25px'
            }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Tipo</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{cancha.tipo}</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Capacidad</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{cancha.capacidad} personas</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Estado</div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: cancha.estado === 'disponible' ? 'green' : 'red'
                }}>
                  {cancha.estado === 'disponible' ? '✅ Disponible' : '❌ No disponible'}
                </div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>Precio por hora</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2ecc71' }}>
                  ${cancha.precio_hora?.toLocaleString() || '50,000'}
                </div>
              </div>
            </div>
          </div>

          {/* Info del usuario */}
          <div style={{
            background: '#e8f5e8',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #c3e6c3'
          }}>
            <h3 style={{ marginBottom: '10px', color: '#155724' }}>✅ Sesión activa</h3>
            <p style={{ color: '#0c5460' }}>
              Estás autenticado como <strong>{usuario.nombre}</strong> ({usuario.correo})
            </p>
          </div>
        </div>

        {/* Sistema de reservas */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{
            background: '#fff',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🗓️ Nueva Reserva
            </h2>

            {step === 'date' && (
              <div>
                <h3 style={{ marginBottom: '15px', color: '#555' }}>Paso 1: Selecciona una fecha</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) setStep('time');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    marginBottom: '15px'
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {step === 'time' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ color: '#555' }}>Paso 2: Selecciona una hora</h3>
                  <button
                    onClick={() => setStep('date')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cambiar fecha
                  </button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {horas.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => {
                        setSelectedTime(hora);
                        setStep('confirm');
                      }}
                      style={{
                        padding: '12px',
                        border: '1px solid #ddd',
                        background: selectedTime === hora ? '#3498db' : 'white',
                        color: selectedTime === hora ? 'white' : '#333',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ color: '#555' }}>Paso 3: Confirma tu reserva</h3>
                  <button
                    onClick={() => setStep('time')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cambiar hora
                  </button>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cancha:</span>
                    <strong>{cancha.nombre}</strong>
                  </div>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fecha:</span>
                    <strong>{selectedDate}</strong>
                  </div>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Hora:</span>
                    <strong>{selectedTime}</strong>
                  </div>
                  <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reservado por:</span>
                    <strong>{usuario.nombre}</strong>
                  </div>
                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '18px' }}>Total a pagar:</span>
                    <strong style={{ fontSize: '24px', color: '#2ecc71' }}>
                      ${cancha.precio_hora?.toLocaleString() || '50,000'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={crearReserva}
                  disabled={creandoReserva}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: creandoReserva ? '#999' : '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: creandoReserva ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creandoReserva ? '⏳ Creando reserva...' : '✅ Confirmar Reserva'}
                </button>
              </div>
            )}

            {step === 'date' && (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                Selecciona una fecha para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}