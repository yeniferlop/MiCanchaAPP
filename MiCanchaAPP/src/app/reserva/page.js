"use client";

import { useEffect } from "react";

export default function ReservaPage() {
  useEffect(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirigiendo...</p>
    </div>
  );
}