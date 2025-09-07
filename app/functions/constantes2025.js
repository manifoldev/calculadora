// Constantes oficiales para 2025 (valores de referencia)
// UMA diaria 2025 (vigente desde 1-feb-2025) y Salario Mínimo General 2025
// Fuente UMA: INEGI/KPMG Flash UMA 2025; Fuente SMG: CONASAMI/Reuters

export const UMA_DIARIA = 113.14; // pesos
export const SALARIO_MINIMO_DIARIO_GENERAL = 278.80; // pesos
export const TOPE_SALARIO_BASE_UMAS = 25; // Límite superior del SBC (25 UMA)

export function obtenerConstantes2025() {
  return {
    UMA_DIARIA,
    SALARIO_MINIMO_DIARIO_GENERAL,
    TOPE_SALARIO_BASE_UMAS,
  };
}

