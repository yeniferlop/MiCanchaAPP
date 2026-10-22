import { Suspense } from "react";
import PagoContent from "./PagoContent";

export default function PagoPage() {
  return (
    <Suspense fallback={<p>Cargando información del pago...</p>}>
      <PagoContent />
    </Suspense>
  );
}
