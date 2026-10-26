"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getReportesResumen,
} from "@/api/adminApi";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function formatMoney(value) {
  return Number(
    value || 0
  ).toLocaleString(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }
  );
}

export default function AdminReportesPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    data,
    setData,
  ] = useState({
    reservasPorMes: [],

    ingresosMensuales: [],

    ingresosAnuales: {
      presencial: 0,
      comprobante: 0,
      total: 0,
      devoluciones: 0,
      neto: 0,
    },

    horariosMasDemandados: [],

    usuariosMasFrecuentes: [],

    estadisticasGenerales: {
      ocupacionPromedio: 0,
      cancelaciones: 0,
      pagosATiempo: 0,
      satisfaccion: 0,
    },
  });

  useEffect(() => {
    loadReportes();
  }, []);

  async function loadReportes() {
    try {
      setLoading(true);

      setError("");

      const res =
        await getReportesResumen();

      setData({
        reservasPorMes:
          res?.reservasPorMes ||
          [],

        ingresosMensuales:
          res?.ingresosMensuales ||
          [],

        ingresosAnuales:
          res?.ingresosAnuales || {
            presencial: 0,
            comprobante: 0,
            total: 0,
            devoluciones: 0,
            neto: 0,
          },

        horariosMasDemandados:
          res?.horariosMasDemandados ||
          [],

        usuariosMasFrecuentes:
          res?.usuariosMasFrecuentes ||
          [],

        estadisticasGenerales:
          res?.estadisticasGenerales || {
            ocupacionPromedio: 0,
            cancelaciones: 0,
            pagosATiempo: 0,
            satisfaccion: 0,
          },
      });
    } catch (error) {
      setError(
        error.message ||
        "Error cargando reportes"
      );
    } finally {
      setLoading(false);
    }
  }

  const maxReservas =
    Math.max(
      ...data.reservasPorMes.map(
        (i) =>
          Number(
            i.total || 0
          )
      ),
      1
    );

  const maxIngresos =
    Math.max(
      ...data.ingresosMensuales.map(
        (i) =>
          Number(
            i.neto || 0
          )
      ),
      1
    );

  const totalPresencial =
    Number(
      data.ingresosAnuales
        ?.presencial || 0
    );

  const totalCuentaInstitucional =
    Number(
      data.ingresosAnuales
        ?.comprobante || 0
    );

  const totalIngresosBrutos =
    Number(
      data.ingresosAnuales
        ?.total || 0
    );

  const totalDevoluciones =
    Number(
      data.ingresosAnuales
        ?.devoluciones || 0
    );

  const totalIngresosNetos =
    Number(
      data.ingresosAnuales
        ?.neto || 0
    );

  const ajustarColumnas = (
    worksheet,
    rows
  ) => {
    if (
      !rows ||
      !rows.length
    ) {
      return;
    }

    const headers =
      Object.keys(
        rows[0]
      );

    worksheet["!cols"] =
      headers.map(
        (header) => {
          const maxLength =
            Math.max(
              header.length,

              ...rows.map(
                (row) =>
                  String(
                    row[
                    header
                    ] ?? ""
                  ).length
              )
            );

          return {
            wch:
              Math.min(
                maxLength + 4,
                35
              ),
          };
        }
      );
  };

  const exportarExcel =
    () => {
      try {
        const wb =
          XLSX.utils.book_new();

        const fechaActual =
          new Date();

        const fechaExportacion =
          fechaActual.toLocaleDateString(
            "es-CO"
          );

        const horaExportacion =
          fechaActual.toLocaleTimeString(
            "es-CO"
          );

        const totalReservas =
          data.reservasPorMes.reduce(
            (
              acc,
              item
            ) =>
              acc +
              Number(
                item.total ||
                0
              ),
            0
          );

        const mesMayorReserva =
          data.reservasPorMes.length
            ? data.reservasPorMes.reduce(
              (
                prev,
                current
              ) =>
                Number(
                  current.total ||
                  0
                ) >
                  Number(
                    prev.total ||
                    0
                  )
                  ? current
                  : prev
            )
            : null;

        const mesMayorIngreso =
          data.ingresosMensuales.length
            ? data.ingresosMensuales.reduce(
              (
                prev,
                current
              ) =>
                Number(
                  current.neto ||
                  0
                ) >
                  Number(
                    prev.neto ||
                    0
                  )
                  ? current
                  : prev
            )
            : null;

        const horarioPico =
          data.horariosMasDemandados.length
            ? data.horariosMasDemandados.reduce(
              (
                prev,
                current
              ) =>
                Number(
                  current.total ||
                  0
                ) >
                  Number(
                    prev.total ||
                    0
                  )
                  ? current
                  : prev
            )
            : null;

        const usuarioMasFrecuente =
          data.usuariosMasFrecuentes.length
            ? data.usuariosMasFrecuentes.reduce(
              (
                prev,
                current
              ) =>
                Number(
                  current.total ||
                  0
                ) >
                  Number(
                    prev.total ||
                    0
                  )
                  ? current
                  : prev
            )
            : null;

        // ==================================================
        // HOJA RESUMEN
        // ==================================================

        const resumenGeneral = [
          {
            Campo: "Módulo",
            Valor:
              "Reportes y Estadísticas",
          },

          {
            Campo: "Sistema",
            Valor: "MICANCHA",
          },

          {
            Campo:
              "Fecha de exportación",
            Valor:
              fechaExportacion,
          },

          {
            Campo:
              "Hora de exportación",
            Valor:
              horaExportacion,
          },

          {
            Campo:
              "Total reservas acumuladas",
            Valor:
              totalReservas,
          },

          {
            Campo:
              "Total pago presencial",
            Valor:
              totalPresencial,
          },

          {
            Campo:
              "Total cuenta institucional",
            Valor:
              totalCuentaInstitucional,
          },

          {
            Campo:
              "Ingresos brutos",
            Valor:
              totalIngresosBrutos,
          },

          {
            Campo:
              "Devoluciones realizadas",
            Valor:
              totalDevoluciones,
          },

          {
            Campo:
              "Ingresos netos",
            Valor:
              totalIngresosNetos,
          },

          {
            Campo:
              "Mes con más reservas",
            Valor:
              mesMayorReserva?.mes ||
              "Sin datos",
          },

          {
            Campo:
              "Cantidad mes con más reservas",
            Valor:
              Number(
                mesMayorReserva?.total ||
                0
              ),
          },

          {
            Campo:
              "Mes con mayor ingreso neto",
            Valor:
              mesMayorIngreso?.mes ||
              "Sin datos",
          },

          {
            Campo:
              "Valor ingreso neto del mes",
            Valor:
              Number(
                mesMayorIngreso?.neto ||
                0
              ),
          },

          {
            Campo:
              "Horario más demandado",
            Valor:
              horarioPico?.hora ||
              "Sin datos",
          },

          {
            Campo:
              "Reservas horario pico",
            Valor:
              Number(
                horarioPico?.total ||
                0
              ),
          },

          {
            Campo:
              "Usuario más frecuente",
            Valor:
              usuarioMasFrecuente?.nombre ||
              "Sin datos",
          },

          {
            Campo:
              "Reservas usuario frecuente",
            Valor:
              Number(
                usuarioMasFrecuente?.total ||
                0
              ),
          },
        ];

        // ==================================================
        // RESERVAS POR MES
        // ==================================================

        const reservasPorMesData =
          data.reservasPorMes.length
            ? data.reservasPorMes.map(
              (item) => ({
                Mes:
                  item.mes,

                "Total Reservas":
                  Number(
                    item.total ||
                    0
                  ),
              })
            )
            : [
              {
                Mes:
                  "Sin datos",

                "Total Reservas":
                  0,
              },
            ];

        // ==================================================
        // INGRESOS MENSUALES
        // ==================================================

        const ingresosMensualesData =
          data.ingresosMensuales.length
            ? data.ingresosMensuales.map(
              (item) => ({
                Mes:
                  item.mes,

                "Pago Presencial":
                  Number(
                    item.presencial ||
                    0
                  ),

                "Cuenta Institucional":
                  Number(
                    item.comprobante ||
                    0
                  ),

                "Ingresos Brutos":
                  Number(
                    item.total ||
                    0
                  ),

                "Devoluciones Realizadas":
                  Number(
                    item.devoluciones ||
                    0
                  ),

                "Ingresos Netos":
                  Number(
                    item.neto ||
                    0
                  ),
              })
            )
            : [
              {
                Mes:
                  "Sin datos",

                "Pago Presencial":
                  0,

                "Cuenta Institucional":
                  0,

                "Ingresos Brutos":
                  0,

                "Devoluciones Realizadas":
                  0,

                "Ingresos Netos":
                  0,
              },
            ];

        const horariosMasDemandadosData =
          data.horariosMasDemandados.length
            ? data.horariosMasDemandados.map(
              (item) => ({
                Hora:
                  item.hora,

                "Total Reservas":
                  Number(
                    item.total ||
                    0
                  ),
              })
            )
            : [
              {
                Hora:
                  "Sin datos",

                "Total Reservas":
                  0,
              },
            ];

        const usuariosMasFrecuentesData =
          data.usuariosMasFrecuentes.length
            ? data.usuariosMasFrecuentes.map(
              (item) => ({
                Usuario:
                  item.nombre,

                "Total Reservas":
                  Number(
                    item.total ||
                    0
                  ),
              })
            )
            : [
              {
                Usuario:
                  "Sin datos",

                "Total Reservas":
                  0,
              },
            ];

        const estadisticasGeneralesData =
          [
            {
              Indicador:
                "Ocupación promedio",

              Valor:
                `${Number(
                  data
                    .estadisticasGenerales
                    .ocupacionPromedio ||
                  0
                )}%`,
            },

            {
              Indicador:
                "Cancelaciones",

              Valor:
                `${Number(
                  data
                    .estadisticasGenerales
                    .cancelaciones ||
                  0
                )}%`,
            },

            {
              Indicador:
                "Pagos a tiempo",

              Valor:
                `${Number(
                  data
                    .estadisticasGenerales
                    .pagosATiempo ||
                  0
                )}%`,
            },

            {
              Indicador:
                "Satisfacción",

              Valor:
                `${Number(
                  data
                    .estadisticasGenerales
                    .satisfaccion ||
                  0
                )}/5`,
            },
          ];

        // ==================================================
        // CREAR HOJAS
        // ==================================================

        const wsResumen =
          XLSX.utils.json_to_sheet(
            resumenGeneral
          );

        const wsReservas =
          XLSX.utils.json_to_sheet(
            reservasPorMesData
          );

        const wsIngresos =
          XLSX.utils.json_to_sheet(
            ingresosMensualesData
          );

        const wsHorarios =
          XLSX.utils.json_to_sheet(
            horariosMasDemandadosData
          );

        const wsUsuarios =
          XLSX.utils.json_to_sheet(
            usuariosMasFrecuentesData
          );

        const wsEstadisticas =
          XLSX.utils.json_to_sheet(
            estadisticasGeneralesData
          );

        ajustarColumnas(
          wsResumen,
          resumenGeneral
        );

        ajustarColumnas(
          wsReservas,
          reservasPorMesData
        );

        ajustarColumnas(
          wsIngresos,
          ingresosMensualesData
        );

        ajustarColumnas(
          wsHorarios,
          horariosMasDemandadosData
        );

        ajustarColumnas(
          wsUsuarios,
          usuariosMasFrecuentesData
        );

        ajustarColumnas(
          wsEstadisticas,
          estadisticasGeneralesData
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsResumen,
          "Resumen"
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsReservas,
          "Reservas por Mes"
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsIngresos,
          "Ingresos Mensuales"
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsHorarios,
          "Horarios Demandados"
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsUsuarios,
          "Usuarios Frecuentes"
        );

        XLSX.utils.book_append_sheet(
          wb,
          wsEstadisticas,
          "Estadísticas"
        );

        const excelBuffer =
          XLSX.write(
            wb,
            {
              bookType:
                "xlsx",

              type:
                "array",
            }
          );

        const blob =
          new Blob(
            [
              excelBuffer,
            ],
            {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
          );

        const fechaArchivo =
          fechaActual
            .toISOString()
            .split("T")[0];

        saveAs(
          blob,
          `reportes_admin_${fechaArchivo}.xlsx`
        );
      } catch (err) {
        console.error(
          "Error exportando Excel:",
          err
        );

        setError(
          "No se pudo exportar el archivo Excel"
        );
      }
    };

  return (
    <div>
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Reportes y Estadísticas
          </h1>

          <p className="text-gray-700">
            Datos reales calculados desde MySQL
          </p>
        </div>


        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">

          <button
            type="button"
            onClick={
              exportarExcel
            }
            disabled={
              loading
            }
            className="bg-green-700 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={
              loadReportes
            }
            disabled={
              loading
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Actualizar
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          Cargando reportes...
        </div>
      ) : (
        <>
          {/* ========================================= */}
          {/* RESUMEN ECONÓMICO */}
          {/* ========================================= */}

          <section
            aria-labelledby="resumen-economico"
            className="mb-6"
          >
            <h2
              id="resumen-economico"
              className="text-xl font-semibold text-gray-800 mb-4"
            >
              Resumen económico del año
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Pago presencial
                </p>

                <p className="text-xl font-bold text-gray-900 mt-2">
                  {formatMoney(
                    totalPresencial
                  )}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Cuenta institucional
                </p>

                <p className="text-xl font-bold text-gray-900 mt-2">
                  {formatMoney(
                    totalCuentaInstitucional
                  )}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-blue-700">
                  Ingresos brutos
                </p>

                <p className="text-xl font-bold text-blue-900 mt-2">
                  {formatMoney(
                    totalIngresosBrutos
                  )}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-red-700">
                  Devoluciones realizadas
                </p>

                <p className="text-xl font-bold text-red-900 mt-2">
                  -
                  {formatMoney(
                    totalDevoluciones
                  )}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-green-700">
                  Ingresos netos
                </p>

                <p className="text-xl font-bold text-green-900 mt-2">
                  {formatMoney(
                    totalIngresosNetos
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* ========================================= */}
          {/* GRÁFICAS */}
          {/* ========================================= */}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Reservas por Mes
              </h2>

              <div className="h-[280px] min-w-0 flex items-end justify-between gap-1 sm:gap-3">
                {data.reservasPorMes.map(
                  (
                    item,
                    index
                  ) => {
                    const height =
                      Math.max(
                        (
                          Number(
                            item.total ||
                            0
                          ) /
                          maxReservas
                        ) *
                        220,
                        8
                      );

                    return (
                      <div
                        key={
                          index
                        }
                        className="flex min-w-0 flex-col items-center flex-1"
                      >
                        <div
                          className="w-full max-w-[28px] bg-blue-500 rounded-t-md"
                          style={{
                            height:
                              `${height}px`,
                          }}
                          title={`${item.mes}: ${item.total} reservas`}
                        ></div>

                        <span className="text-xs text-gray-500 mt-2">
                          {
                            item.mes
                          }
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Ingresos Netos Mensuales
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Ingresos brutos menos devoluciones realizadas.
              </p>

              <div className="h-[280px] min-w-0 flex items-end justify-between gap-1 sm:gap-3">
                {data.ingresosMensuales.map(
                  (
                    item,
                    index
                  ) => {
                    const valorNeto =
                      Number(
                        item.neto ||
                        0
                      );

                    const height =
                      Math.max(
                        (
                          Math.max(
                            valorNeto,
                            0
                          ) /
                          maxIngresos
                        ) *
                        220,
                        8
                      );

                    return (
                      <div
                        key={
                          index
                        }
                        className="flex min-w-0 flex-col items-center flex-1"
                      >
                        <div
                          className="w-full max-w-[28px] bg-green-500 rounded-t-md"
                          style={{
                            height:
                              `${height}px`,
                          }}
                          title={
                            `${item.mes} | ` +
                            `Bruto: ${formatMoney(
                              item.total
                            )} | ` +
                            `Devoluciones: ${formatMoney(
                              item.devoluciones
                            )} | ` +
                            `Neto: ${formatMoney(
                              item.neto
                            )}`
                          }
                        ></div>

                        <span className="text-xs text-gray-500 mt-2">
                          {
                            item.mes
                          }
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* ========================================= */}
          {/* TABLA ECONÓMICA MENSUAL */}
          {/* ========================================= */}

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Detalle económico mensual
            </h2>

            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm text-gray-600">
                      Mes
                    </th>

                    <th className="text-right p-3 text-sm text-gray-600">
                      Presencial
                    </th>

                    <th className="text-right p-3 text-sm text-gray-600">
                      Cuenta institucional
                    </th>

                    <th className="text-right p-3 text-sm text-gray-600">
                      Bruto
                    </th>

                    <th className="text-right p-3 text-sm text-gray-600">
                      Devoluciones
                    </th>

                    <th className="text-right p-3 text-sm text-gray-600">
                      Neto
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.ingresosMensuales.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={
                          index
                        }
                        className="border-b border-gray-100"
                      >
                        <td className="p-3 font-medium text-gray-800">
                          {
                            item.mes
                          }
                        </td>

                        <td className="p-3 text-right text-gray-700">
                          {formatMoney(
                            item.presencial
                          )}
                        </td>

                        <td className="p-3 text-right text-gray-700">
                          {formatMoney(
                            item.comprobante
                          )}
                        </td>

                        <td className="p-3 text-right text-blue-800 font-semibold">
                          {formatMoney(
                            item.total
                          )}
                        </td>

                        <td className="p-3 text-right text-red-700 font-semibold">
                          {Number(
                            item.devoluciones ||
                            0
                          ) >
                            0
                            ? `-${formatMoney(
                              item.devoluciones
                            )}`
                            : formatMoney(
                              0
                            )}
                        </td>

                        <td className="p-3 text-right text-green-800 font-bold">
                          {formatMoney(
                            item.neto
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ========================================= */}
          {/* REPORTES EXISTENTES */}
          {/* ========================================= */}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Horarios Más Demandados
              </h3>

              <div className="space-y-3">
                {data.horariosMasDemandados.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="flex items-center justify-between"
                    >
                      <span className="text-blue-700">
                        {
                          item.hora
                        }
                      </span>

                      <span className="font-semibold text-blue-900">
                        {
                          item.total
                        }{" "}
                        reservas
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Usuarios Más Frecuentes
              </h3>

              <div className="space-y-3">
                {data.usuariosMasFrecuentes.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-green-700">
                        {
                          item.nombre
                        }
                      </span>

                      <span className="font-semibold text-green-900">
                        {
                          item.total
                        }{" "}
                        reservas
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                Estadísticas Generales
              </h3>

              <div className="space-y-3 text-purple-700">
                <div className="flex justify-between">
                  <span>
                    Ocupación promedio
                  </span>

                  <span className="font-semibold">
                    {
                      data
                        .estadisticasGenerales
                        .ocupacionPromedio
                    }
                    %
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Cancelaciones
                  </span>

                  <span className="font-semibold">
                    {
                      data
                        .estadisticasGenerales
                        .cancelaciones
                    }
                    %
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Pagos a tiempo
                  </span>

                  <span className="font-semibold">
                    {
                      data
                        .estadisticasGenerales
                        .pagosATiempo
                    }
                    %
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Satisfacción
                  </span>

                  <span className="font-semibold">
                    {
                      data
                        .estadisticasGenerales
                        .satisfaccion
                    }
                    /5
                  </span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}