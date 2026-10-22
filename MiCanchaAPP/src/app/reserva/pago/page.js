"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");


export default function PagoReservaPage() {
  const [metodo, setMetodo] = useState("presencial");
  const [archivo, setArchivo] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const idReserva = searchParams.get("idReserva");

  const enviarPago = async () => {
    try {
      if (!idReserva) {
        alert("No se encontró el id de la reserva");
        return;
      }

      const formData = new FormData();
      formData.append("metodo_pago", metodo);

      if (metodo === "comprobante") {
        if (!archivo) {
          alert("Debes subir un comprobante");
          return;
        }
        formData.append("comprobante", archivo);
      }


      const res = await fetch(
        `${API_URL}/api/reservas/${idReserva}/pago`,
        {
          method: "PUT",
          body: formData,
        }
      );


      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "Error al enviar el pago");
      }

      alert(data.mensaje || "Pago enviado correctamente");
      router.push("/dashboard");
    } catch (error) {
      alert(error.message || "No se pudo conectar con el servidor");
    }
  };

  return (
    <div>
      <h2>Seleccionar método de pago</h2>

      <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
        <option value="presencial">Presencial</option>
        <option value="comprobante">Comprobante</option>
      </select>

      {metodo === "comprobante" && (
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setArchivo(e.target.files[0])}
        />
      )}

      <button onClick={enviarPago}>Enviar pago</button>
    </div>
  );
}