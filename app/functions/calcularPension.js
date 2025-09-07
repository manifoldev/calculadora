/**
 * Calcula la pensión IMSS bajo la Ley del Seguro Social de 1973
 * Actualizado con valores oficiales para 2025
 * 
 * @param {number} edadRetiro - Edad de retiro (60-70 años)
 * @param {number} semanas - Total de semanas cotizadas
 * @param {number} salario - Salario promedio diario de cotización
 * @param {number} hijos - Número de hijos (0-10)
 * @param {number} padresDependientes - Número de padres dependientes (0-2)
 * @param {number} pareja - Si tiene pareja (0 o 1)
 * @returns {number} Pensión mensual calculada
 */
import { UMA_DIARIA, SALARIO_MINIMO_DIARIO_GENERAL, TOPE_SALARIO_BASE_UMAS } from "./constantes2025.js";

export function calcularPension(edadRetiro, semanas, salarioPromedioDiario, hijos, padresDependientes, pareja) {
  // Guardas básicas de elegibilidad (Ley 73: mínimo 500 semanas)
  if (semanas < 500) {
    return 0;
  }

  // Tope del salario promedio a 25 UMA
  const salarioBase = Math.min(salarioPromedioDiario, TOPE_SALARIO_BASE_UMAS * UMA_DIARIA);

  // Clasificación por veces salario mínimo (Ley 73 Art. 167)
  const vecesSalarioMinimo = salarioBase / SALARIO_MINIMO_DIARIO_GENERAL;
  
  // TABLA DE PORCENTAJES OFICIAL (Artículo 167 LSS 1973)
  // Actualizada con todos los rangos salariales completos
  let cuantiaBasica, incrementoAnual;

  if (vecesSalarioMinimo < 1.01) {
    cuantiaBasica = 0.8;
    incrementoAnual = 0.00563;
  } else if (vecesSalarioMinimo < 1.26) {
    cuantiaBasica = 0.7711;
    incrementoAnual = 0.00814;
  } else if (vecesSalarioMinimo < 1.51) {
    cuantiaBasica = 0.5818;
    incrementoAnual = 0.01178;
  } else if (vecesSalarioMinimo < 1.76) {
    cuantiaBasica = 0.4923;
    incrementoAnual = 0.0143;
  } else if (vecesSalarioMinimo < 2.01) {
    cuantiaBasica = 0.4267;
    incrementoAnual = 0.01615;
  } else if (vecesSalarioMinimo < 2.26) {
    cuantiaBasica = 0.3765;
    incrementoAnual = 0.01756;
  } else if (vecesSalarioMinimo < 2.51) {
    cuantiaBasica = 0.3368;
    incrementoAnual = 0.01868;
  } else if (vecesSalarioMinimo < 2.76) {
    cuantiaBasica = 0.3048; // 30.48%
    incrementoAnual = 0.01958; // 1.958%
  } else if (vecesSalarioMinimo < 3.01) {
    cuantiaBasica = 0.2783; // 27.83%
    incrementoAnual = 0.02033; // 2.033%
  } else if (vecesSalarioMinimo < 3.26) {
    cuantiaBasica = 0.256;
    incrementoAnual = 0.02096;
  } else if (vecesSalarioMinimo < 3.51) {
    cuantiaBasica = 0.237;
    incrementoAnual = 0.02149;
  } else if (vecesSalarioMinimo < 3.76) {
    cuantiaBasica = 0.2207;
    incrementoAnual = 0.02195;
  } else if (vecesSalarioMinimo < 4.01) {
    cuantiaBasica = 0.2065;
    incrementoAnual = 0.02235;
  } else if (vecesSalarioMinimo < 4.26) {
    cuantiaBasica = 0.1939;
    incrementoAnual = 0.02271;
  } else if (vecesSalarioMinimo < 4.51) {
    cuantiaBasica = 0.1829;
    incrementoAnual = 0.02302;
  } else if (vecesSalarioMinimo < 4.76) {
    cuantiaBasica = 0.173;
    incrementoAnual = 0.0233;
  } else if (vecesSalarioMinimo < 5.01) {
    cuantiaBasica = 0.1641;
    incrementoAnual = 0.02355;
  } else if (vecesSalarioMinimo < 5.26) {
    cuantiaBasica = 0.1561;
    incrementoAnual = 0.02377;
  } else if (vecesSalarioMinimo < 5.51) {
    cuantiaBasica = 0.1488;
    incrementoAnual = 0.02398;
  } else if (vecesSalarioMinimo < 5.76) {
    cuantiaBasica = 0.1422; // 14.22%
    incrementoAnual = 0.02416; // 2.416%
  } else if (vecesSalarioMinimo < 6.01) {
    cuantiaBasica = 0.1362; // 13.62%
    incrementoAnual = 0.02433; // 2.433%
  } else {
    cuantiaBasica = 0.13; // 13.00%
    incrementoAnual = 0.0245; // 2.450%
  }

  const cuantiaBasicaPorDia = salarioBase * cuantiaBasica;
  const cuantiaBasicaAnual = cuantiaBasicaPorDia * 365;
  const cuantiaIncrementosAnuales = salarioBase * incrementoAnual * 365;
  
  let incrementosAnuales = Math.max(0, (semanas - 500) / 52);
  const decimalIncrementosAnuales = incrementosAnuales - Math.floor(incrementosAnuales);
  
  
  if (decimalIncrementosAnuales < 0.25) {
    incrementosAnuales = Math.floor(incrementosAnuales);
  } else if (decimalIncrementosAnuales <= 0.5) {
    incrementosAnuales = Math.floor(incrementosAnuales) + 0.5;
  } else {
    incrementosAnuales = Math.ceil(incrementosAnuales);
  }
  
  const totalIncrementosAnuales = cuantiaIncrementosAnuales * incrementosAnuales;
  
  const cuantiaTotalAnual = cuantiaBasicaAnual + totalIncrementosAnuales;

  // Asignaciones familiares (Ley 73):
  // - Pareja (cónyuge o concubina/o): 15%
  // - Hijos: 10% cada uno (según requisitos de edad/estudio; aquí se toma el número ingresado)
  // - Padres: 10% cada uno SOLO si no hay pareja ni hijos
  // - Ayuda asistencial: 15% si NO hay pareja, hijos ni padres; 10% adicional si SOLO hay un ascendiente

  const tienePareja = pareja === 1;
  const tieneHijos = (hijos ?? 0) > 0;
  const numeroPadres = Math.max(0, Math.min(2, padresDependientes ?? 0));

  const asignacionPareja = tienePareja ? 0.15 * cuantiaTotalAnual : 0;
  const asignacionHijos = tieneHijos ? 0.1 * hijos * cuantiaTotalAnual : 0;
  const asignacionPadres = (!tienePareja && !tieneHijos) ? (0.1 * numeroPadres * cuantiaTotalAnual) : 0;
  const ayudaAsistencial15 = (!tienePareja && !tieneHijos && numeroPadres === 0) ? 0.15 * cuantiaTotalAnual : 0;
  const ayudaAsistencial10UnSoloAsc = (!tienePareja && !tieneHijos && numeroPadres === 1) ? 0.10 * cuantiaTotalAnual : 0;

  const cuantiaConAsignacionesAnual = cuantiaTotalAnual + asignacionPareja + asignacionHijos + asignacionPadres + ayudaAsistencial15 + ayudaAsistencial10UnSoloAsc;
  
  // CÁLCULO FINAL SIN FACTOR DE AGUINALDO
  // El aguinaldo se paga por separado en noviembre (una mensualidad adicional)
  const pensionPorVejezAnual = cuantiaConAsignacionesAnual;
  
  let pensionAnual;
  if (edadRetiro <= 60.5) {
    pensionAnual = pensionPorVejezAnual * 0.75;
  } else if (edadRetiro <= 61.5) {
    pensionAnual = pensionPorVejezAnual * 0.8;
  } else if (edadRetiro <= 62.5) {
    pensionAnual = pensionPorVejezAnual * 0.85;
  } else if (edadRetiro <= 63.5) {
    pensionAnual = pensionPorVejezAnual * 0.9;
  } else if (edadRetiro < 64.5) {
    pensionAnual = pensionPorVejezAnual * 0.95;
  } else {
    pensionAnual = pensionPorVejezAnual;
  }

  // Conversión a mensual y aplicación de PMG mensual
  const pensionMensualPrePMG = pensionAnual / 12;
  const PMG_MENSUAL = SALARIO_MINIMO_DIARIO_GENERAL * 30; // criterio mensual común
  const pensionMensualCalculada = Math.max(pensionMensualPrePMG, PMG_MENSUAL);

  return {
    mensual: pensionMensualCalculada,
    mensualAntesPMG: pensionMensualPrePMG,
    aplicaPMG: pensionMensualPrePMG < PMG_MENSUAL,
    salarioBaseUtilizado: salarioBase
  };
}

// Ajustes 2025 efectuados:
// - Tope salarial de 25 UMA aplicado al salario base.
// - Clasificación por veces salario mínimo (no UMA) conforme Art. 167 Ley 73.
// - Porcentaje del último rango actualizado (2.450%).
// - Redondeo de fracciones: <0.25=0; 0.25–0.5=0.5; >0.5=1.0.
// - Exclusividad de ascendientes y ayuda asistencial del 10% cuando solo hay un ascendiente.
// - PMG aplicada en monto mensual después de anual/12.
