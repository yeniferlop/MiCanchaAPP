-- =====================================================================
-- ETAPA 1 - SEED de contenidos educativos iniciales
-- No duplica: solo inserta si no existe ya un registro con el mismo
-- titulo. No modifica ni elimina filas existentes.
-- =====================================================================

INSERT INTO contenido_educativo (titulo, contenido, categoria, activo, orden)
SELECT * FROM (
  SELECT
    'Uso Obligatorio de Calzado Adecuado (Grama Sintetica)' AS titulo,
    '- Usar unicamente tenis con suela de goma plana o zapatillas con taches de goma pequenos (tipo Turf / Multitaco TF).\n- Esta estrictamente prohibido el uso de calzado con taches de aluminio o taches altos de futbol 11, ya que desgarran la fibra sintetica y perforan la base elastica de caucho.' AS contenido,
    'cuidado' AS categoria, 1 AS activo, 1 AS orden
  UNION ALL
  SELECT
    'Preservacion, Limpieza e Higiene del Escenario',
    '- Queda prohibido ingresar con chicles o goma de mascar, alimentos, bebidas azucaradas oscuras o envases de vidrio.\n- Solo se permite el ingreso de agua o bebidas hidratantes en recipientes plasticos cerrados o botilitos.\n- No arrojar basura al interior del campo; deposita los residuos en las canecas de reciclaje ubicadas en los costados.',
    'cuidado', 1, 2
  UNION ALL
  SELECT
    'Normas de Convivencia, Seguridad y Juego Limpio',
    '- Prohibido el consumo de bebidas alcoholicas, cigarrillos tradicionales o electronicos y sustancias alucinogenas dentro del complejo deportivo.\n- Fomentamos la sana convivencia, el respeto entre deportistas y el trato digno hacia el personal de administracion municipal.\n- Cualquier dano intencional a la infraestructura (mallas, arcos, graderias, luminarias) sera responsabilidad del titular de la reserva.',
    'normas', 1, 3
  UNION ALL
  SELECT
    'Puntualidad en los Horarios de Reserva',
    '- Los turnos inician y terminan puntualmente a la hora reservada en el sistema.\n- Los equipos deben estar listos 10 minutos antes y desalojar el terreno al finalizar su franja para permitir el ingreso puntual del siguiente grupo.',
    'normas', 1, 4
  UNION ALL
  SELECT
    'Guia Paso a Paso: Como Reservar tu Horario',
    '1. Consulta de Disponibilidad: Ingresa al sistema MiCancha y revisa el calendario interactivo con las fechas en verde (disponible).\n2. Seleccion de Horario: Elige tu hora de inicio y fin dentro de los horarios habilitados (07:00 a 21:00).\n3. Verificacion de Resumen: Confirma el numero de horas y el valor total a cancelar ($15.000 por hora).\n4. Registro de Pago: Realiza la consignacion o transferencia segun las cuentas oficiales y adjunta el comprobante digital o selecciona pago presencial.\n5. Confirmacion Oficial: Una vez el administrador valida el comprobante, recibiras la confirmacion de tu turno en tu panel.',
    'proceso', 1, 5
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM contenido_educativo ce WHERE ce.titulo = seed.titulo
);
