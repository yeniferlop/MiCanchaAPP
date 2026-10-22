"use client";

import { useEffect, useState } from "react";
import { getAdminDashboard } from "@/api/adminApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState({
    reservasHoy: 0,
    pagosPendientes: 0,
    montoPagosPendientes: 0,
    ingresosMes: 0,
    usuariosTotales: 0,
    reservasPorSemana: [],
    horariosMasDemandados: [],
  });

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboard();

      setDashboard({
        reservasHoy: Number(data?.reservasHoy || 0),
        pagosPendientes: Number(data?.pagosPendientes || 0),
        montoPagosPendientes: Number(data?.montoPagosPendientes || 0),
        ingresosMes: Number(data?.ingresosMes || 0),
        usuariosTotales: Number(data?.usuariosTotales || 0),
        reservasPorSemana: Array.isArray(data?.reservasPorSemana)
          ? data.reservasPorSemana
          : [],
        horariosMasDemandados: Array.isArray(data?.horariosMasDemandados)
          ? data.horariosMasDemandados
          : [],
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    });
  };

  const reservasSemana =
    dashboard.reservasPorSemana.length > 0
      ? dashboard.reservasPorSemana
      : [
          { dia: "Lun", total: 0 },
          { dia: "Mar", total: 0 },
          { dia: "Mié", total: 0 },
          { dia: "Jue", total: 0 },
          { dia: "Vie", total: 0 },
          { dia: "Sáb", total: 0 },
          { dia: "Dom", total: 0 },
        ];

  const horariosDemandados = dashboard.horariosMasDemandados.length
    ? dashboard.horariosMasDemandados
    : [];

  const maxReservaSemana = Math.max(
    ...reservasSemana.map((i) => Number(i.total || 0)),
    1
  );

  const maxHorario = Math.max(
    ...horariosDemandados.map((i) => Number(i.total || 0)),
    1
  );

  const getNivelDemanda = (valor, maximo) => {
    const porcentaje = maximo > 0 ? (Number(valor || 0) / maximo) * 100 : 0;

    if (porcentaje >= 70) return "Alta";
    if (porcentaje >= 40) return "Media";
    return "Baja";
  };

  const getObservacionDemanda = (valor, maximo) => {
    const porcentaje = maximo > 0 ? (Number(valor || 0) / maximo) * 100 : 0;

    if (porcentaje >= 70) return "Alta demanda";
    if (porcentaje >= 40) return "Demanda media";
    if (porcentaje > 0) return "Baja demanda";
    return "Sin movimiento";
  };

  const ajustarColumnas = (worksheet, data) => {
    if (!data || !data.length) return;

    const keys = Object.keys(data[0]);

    worksheet["!cols"] = keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? "").length)
      );

      return { wch: Math.min(maxLength + 4, 35) };
    });
  };

  const exportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const fechaActual = new Date();
      const fechaExportacion = fechaActual.toLocaleDateString("es-CO");
      const horaExportacion = fechaActual.toLocaleTimeString("es-CO");

      const totalReservasSemana = reservasSemana.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0
      );

      const totalHorariosDemandados = horariosDemandados.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0
      );

      const promedioReservasDia =
        reservasSemana.length > 0
          ? (totalReservasSemana / reservasSemana.length).toFixed(2)
          : 0;

      const diaPico =
        reservasSemana.length > 0
          ? reservasSemana.reduce((prev, current) =>
              Number(current.total || 0) > Number(prev.total || 0)
                ? current
                : prev
            )
          : null;

      const horaPico =
        horariosDemandados.length > 0
          ? horariosDemandados.reduce((prev, current) =>
              Number(current.total || 0) > Number(prev.total || 0)
                ? current
                : prev
            )
          : null;

      const ingresoPromedioReserva =
        dashboard.reservasHoy > 0
          ? Math.round(dashboard.ingresosMes / dashboard.reservasHoy)
          : 0;

      const tasaPagosPendientes =
        dashboard.reservasHoy > 0
          ? ((dashboard.pagosPendientes / dashboard.reservasHoy) * 100).toFixed(2)
          : "0.00";

      const resumenEjecutivo = [
        { Campo: "Módulo", Valor: "Dashboard Admin" },
        { Campo: "Sistema", Valor: "MICANCHA" },
        { Campo: "Fecha de exportación", Valor: fechaExportacion },
        { Campo: "Hora de exportación", Valor: horaExportacion },
        { Campo: "Reservas Hoy", Valor: dashboard.reservasHoy },
        { Campo: "Pagos Pendientes", Valor: dashboard.pagosPendientes },
        {
          Campo: "Monto Pagos Pendientes",
          Valor: dashboard.montoPagosPendientes,
        },
        { Campo: "Ingresos Mes", Valor: dashboard.ingresosMes },
        { Campo: "Usuarios Totales", Valor: dashboard.usuariosTotales },
        { Campo: "Total Reservas Semana", Valor: totalReservasSemana },
        { Campo: "Promedio Reservas por Día", Valor: promedioReservasDia },
        { Campo: "Día Pico", Valor: diaPico ? diaPico.dia : "Sin datos" },
        {
          Campo: "Reservas Día Pico",
          Valor: diaPico ? Number(diaPico.total || 0) : 0,
        },
        { Campo: "Hora Pico", Valor: horaPico ? horaPico.hora : "Sin datos" },
        {
          Campo: "Reservas Hora Pico",
          Valor: horaPico ? Number(horaPico.total || 0) : 0,
        },
      ];

      const reservasSemanaData = reservasSemana.map((item) => {
        const total = Number(item.total || 0);
        const porcentaje =
          totalReservasSemana > 0
            ? ((total / totalReservasSemana) * 100).toFixed(2) + "%"
            : "0.00%";

        return {
          Dia: item.dia,
          "Total Reservas": total,
          "Porcentaje Semana": porcentaje,
          Observacion: getObservacionDemanda(total, maxReservaSemana),
        };
      });

      const horariosDemandadosData = horariosDemandados.length
        ? horariosDemandados.map((item) => {
            const total = Number(item.total || 0);
            const porcentaje =
              totalHorariosDemandados > 0
                ? ((total / totalHorariosDemandados) * 100).toFixed(2) + "%"
                : "0.00%";

            return {
              Hora: item.hora,
              "Total Reservas": total,
              "Porcentaje Demanda": porcentaje,
              "Nivel Demanda": getNivelDemanda(total, maxHorario),
            };
          })
        : [{ Hora: "Sin datos", "Total Reservas": 0, "Porcentaje Demanda": "0.00%", "Nivel Demanda": "Baja" }];

      const indicadoresData = [
        {
          Indicador: "Total reservas semana",
          Valor: totalReservasSemana,
        },
        {
          Indicador: "Promedio reservas por día",
          Valor: promedioReservasDia,
        },
        {
          Indicador: "Cantidad pagos pendientes",
          Valor: dashboard.pagosPendientes,
        },
        {
          Indicador: "Tasa pagos pendientes",
          Valor: `${tasaPagosPendientes}%`,
        },
        {
          Indicador: "Monto pagos pendientes",
          Valor: dashboard.montoPagosPendientes,
        },
        {
          Indicador: "Ingresos del mes",
          Valor: dashboard.ingresosMes,
        },
        {
          Indicador: "Ingreso promedio por reserva",
          Valor: ingresoPromedioReserva,
        },
        {
          Indicador: "Usuarios totales registrados",
          Valor: dashboard.usuariosTotales,
        },
        {
          Indicador: "Día más fuerte",
          Valor: diaPico ? diaPico.dia : "Sin datos",
        },
        {
          Indicador: "Hora más fuerte",
          Valor: horaPico ? horaPico.hora : "Sin datos",
        },
      ];

      const wsResumen = XLSX.utils.json_to_sheet(resumenEjecutivo);
      const wsReservasSemana = XLSX.utils.json_to_sheet(reservasSemanaData);
      const wsHorarios = XLSX.utils.json_to_sheet(horariosDemandadosData);
      const wsIndicadores = XLSX.utils.json_to_sheet(indicadoresData);

      ajustarColumnas(wsResumen, resumenEjecutivo);
      ajustarColumnas(wsReservasSemana, reservasSemanaData);
      ajustarColumnas(wsHorarios, horariosDemandadosData);
      ajustarColumnas(wsIndicadores, indicadoresData);

      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo");
      XLSX.utils.book_append_sheet(wb, wsReservasSemana, "Reservas Semana");
      XLSX.utils.book_append_sheet(wb, wsHorarios, "Horarios Demandados");
      XLSX.utils.book_append_sheet(wb, wsIndicadores, "Indicadores");

      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fechaArchivo = fechaActual.toISOString().split("T")[0];
      saveAs(blob, `dashboard_admin_completo_${fechaArchivo}.xlsx`);
    } catch (err) {
      setError("No se pudo exportar el archivo Excel");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-700">Cancha Sintética - Bolívar, Cauca</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={loading}
            aria-label="Exportar datos del dashboard en formato Excel"
            className="bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-800 transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60"
          >
            📊 Exportar Excel
          </button>

          <button
            type="button"
            onClick={cargarDashboard}
            aria-label="Actualizar métricas del dashboard"
            className="bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            🔄 Actualizar
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 border-l-4 border-red-600 text-red-900 px-4 py-3 rounded-r-xl text-sm font-medium">
          ✕ {error}
        </div>
      )}

      <section aria-label="Métricas principales" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-900 text-xl font-bold" aria-hidden="true">📅</div>
            <span className="text-green-800 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold border border-green-200">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? "..." : dashboard.reservasHoy}
          </p>
          <p className="text-gray-700 font-medium mt-1">Reservas Hoy</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-900 text-xl font-bold" aria-hidden="true">⏳</div>
            <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold border border-red-200">
              {loading ? "..." : `${dashboard.pagosPendientes} pendientes`}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? "..." : formatMoney(dashboard.montoPagosPendientes)}
          </p>
          <p className="text-gray-700 font-medium mt-1">Pagos Pendientes</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-900 text-xl font-bold" aria-hidden="true">💰</div>
            <span className="text-green-800 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold border border-green-200">Mes actual</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? "..." : formatMoney(dashboard.ingresosMes)}
          </p>
          <p className="text-gray-700 font-medium mt-1">Ingresos Mes</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-900 text-xl font-bold" aria-hidden="true">👥</div>
            <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full text-xs font-bold border border-purple-200">Registrados</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? "..." : dashboard.usuariosTotales}
          </p>
          <p className="text-gray-700 font-medium mt-1">Usuarios Totales</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Reservas por Semana
          </h2>

          <div className="h-[280px] flex items-end justify-between gap-3">
            {reservasSemana.map((item, index) => {
              const height = Math.max(
                (Number(item.total || 0) / maxReservaSemana) * 220,
                8
              );

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full max-w-[32px] bg-blue-500 rounded-t-md"
                    style={{ height: `${height}px` }}
                    title={`${item.dia}: ${item.total}`}
                  ></div>
                  <span className="text-xs text-gray-700 mt-2">{item.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Horarios Más Demandados
          </h2>

          <div className="h-[280px] flex items-end justify-between gap-3">
            {horariosDemandados.length > 0 ? (
              horariosDemandados.map((item, index) => {
                const height = Math.max(
                  (Number(item.total || 0) / maxHorario) * 220,
                  8
                );

                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full max-w-[36px] bg-green-500 rounded-t-md"
                      style={{ height: `${height}px` }}
                      title={`${item.hora}: ${item.total}`}
                    ></div>
                    <span className="text-xs text-gray-700 mt-2">{item.hora}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sin datos disponibles
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}