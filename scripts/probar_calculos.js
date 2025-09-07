// Script simple de pruebas para validar la lógica de pensión Ley 73 (IMSS)
import { calcularPension } from "../app/functions/calcularPension.js";
import { UMA_DIARIA, SALARIO_MINIMO_DIARIO_GENERAL } from "../app/functions/constantes2025.js";

function calcularEsperado({ edadRetiro, semanas, salarioDiario, hijos=0, padres=0, pareja=0 }) {
  // Tabla por veces salario mínimo (Ley 73 Art. 167)
  const vsm = salarioDiario / SALARIO_MINIMO_DIARIO_GENERAL;
  let b, inc;
  if (vsm < 1.01) { b = 0.8;   inc = 0.00563; }
  else if (vsm < 1.26) { b = 0.7711; inc = 0.00814; }
  else if (vsm < 1.51) { b = 0.5818; inc = 0.01178; }
  else if (vsm < 1.76) { b = 0.4923; inc = 0.0143; }
  else if (vsm < 2.01) { b = 0.4267; inc = 0.01615; }
  else if (vsm < 2.26) { b = 0.3765; inc = 0.01756; }
  else if (vsm < 2.51) { b = 0.3368; inc = 0.01868; }
  else if (vsm < 2.76) { b = 0.3048; inc = 0.01958; }
  else if (vsm < 3.01) { b = 0.2783; inc = 0.02033; }
  else if (vsm < 3.26) { b = 0.256;  inc = 0.02096; }
  else if (vsm < 3.51) { b = 0.237;  inc = 0.02149; }
  else if (vsm < 3.76) { b = 0.2207; inc = 0.02195; }
  else if (vsm < 4.01) { b = 0.2065; inc = 0.02235; }
  else if (vsm < 4.26) { b = 0.1939; inc = 0.02271; }
  else if (vsm < 4.51) { b = 0.1829; inc = 0.02302; }
  else if (vsm < 4.76) { b = 0.173;  inc = 0.0233; }
  else if (vsm < 5.01) { b = 0.1641; inc = 0.02355; }
  else if (vsm < 5.26) { b = 0.1561; inc = 0.02377; }
  else if (vsm < 5.51) { b = 0.1488; inc = 0.02398; }
  else if (vsm < 5.76) { b = 0.1422; inc = 0.02416; }
  else if (vsm < 6.01) { b = 0.1362; inc = 0.02433; }
  else { b = 0.13; inc = 0.0245; }

  // Tope 25 UMA
  const salarioBase = Math.min(salarioDiario, 25 * UMA_DIARIA);

  const baseAnual = salarioBase * b * 365;
  let y = Math.max(0, (semanas - 500) / 52);
  const frac = y - Math.floor(y);
  if (frac < 0.25) y = Math.floor(y);
  else if (frac <= 0.5) y = Math.floor(y) + 0.5;
  else y = Math.ceil(y);
  const incAnual = salarioBase * inc * 365 * y;
  const subtotalAnual = baseAnual + incAnual;

  const tienePareja = pareja === 1;
  const tieneHijos = (hijos ?? 0) > 0;
  const numPadres = Math.max(0, Math.min(2, padres ?? 0));
  const asigPareja = tienePareja ? 0.15 * subtotalAnual : 0;
  const asigHijos = tieneHijos ? 0.1 * hijos * subtotalAnual : 0;
  const asigPadres = (!tienePareja && !tieneHijos) ? (0.1 * numPadres * subtotalAnual) : 0;
  const ayuda15 = (!tienePareja && !tieneHijos && numPadres === 0) ? 0.15 * subtotalAnual : 0;
  const ayuda10 = (!tienePareja && !tieneHijos && numPadres === 1) ? 0.10 * subtotalAnual : 0;

  let anual = subtotalAnual + asigPareja + asigHijos + asigPadres + ayuda15 + ayuda10;

  // Factor por edad
  let factor = 1;
  if (edadRetiro <= 60.5) factor = 0.75;
  else if (edadRetiro <= 61.5) factor = 0.8;
  else if (edadRetiro <= 62.5) factor = 0.85;
  else if (edadRetiro <= 63.5) factor = 0.9;
  else if (edadRetiro < 64.5) factor = 0.95;
  anual *= factor;

  let mensual = anual / 12;

  // Tope 85/90/100
  let pctTope = semanas < 1500 ? 0.85 : (semanas < 2000 ? 0.90 : 1.00);
  const mensualTope = (salarioBase * 365 / 12) * pctTope;
  mensual = Math.min(mensual, mensualTope);

  // PMG mensual (SMG*30)
  const PMG = SALARIO_MINIMO_DIARIO_GENERAL * 30;
  mensual = Math.max(mensual, PMG);
  return mensual;
}

function casiIgual(a, b, eps = 0.5) { // tolerancia 50 centavos
  return Math.abs(a - b) <= eps;
}

function probar(nombre, fn) {
  try { fn(); console.log(`✔ ${nombre}`); } catch (e) { console.error(`✘ ${nombre}:`, e.message); process.exitCode = 1; }
}

// Caso 1: PMG debe aplicar (1 SMG, 500 semanas, 65 años)
probar("PMG aplica con 1 SMG y 500 semanas", () => {
  const salario = SALARIO_MINIMO_DIARIO_GENERAL; // 1 SMG
  const r = calcularPension(65, 500, salario, 0, 0, 0);
  const esperado = calcularEsperado({ edadRetiro:65, semanas:500, salarioDiario:salario });
  if (!casiIgual(r, esperado)) throw new Error(`esperado ${esperado.toFixed(2)} vs ${r.toFixed(2)}`);
});

// Caso 2: Redondeo fracciones (500+26 y 500+27 semanas)
probar("Fracción 26 semanas cuenta como 0.5 año", () => {
  const salario = 2 * SALARIO_MINIMO_DIARIO_GENERAL;
  const r26 = calcularPension(65, 526, salario, 0, 0, 0);
  const e26 = calcularEsperado({ edadRetiro:65, semanas:526, salarioDiario:salario });
  if (!casiIgual(r26, e26)) throw new Error(`26s esperado ${e26.toFixed(2)} vs ${r26.toFixed(2)}`);
  const r27 = calcularPension(65, 527, salario, 0, 0, 0);
  const e27 = calcularEsperado({ edadRetiro:65, semanas:527, salarioDiario:salario });
  if (!(r27 > r26 && casiIgual(r27, e27))) throw new Error(`27s esperado ${e27.toFixed(2)} vs ${r27.toFixed(2)}`);
});

// Caso 3: Topes 85% y 90% y 100%
probar("Tope 85% <1500 semanas", () => {
  const salario = 10 * SALARIO_MINIMO_DIARIO_GENERAL; // alto
  const r = calcularPension(65, 1200, salario, 3, 0, 1); // asignaciones altas
  const esperado = calcularEsperado({ edadRetiro:65, semanas:1200, salarioDiario:salario, hijos:3, padres:0, pareja:1 });
  if (!casiIgual(r, esperado)) throw new Error(`esperado ${esperado.toFixed(2)} vs ${r.toFixed(2)}`);
});

probar("Tope 90% 1500-1999 semanas", () => {
  const salario = 10 * SALARIO_MINIMO_DIARIO_GENERAL;
  const r = calcularPension(65, 1800, salario, 2, 0, 1);
  const esperado = calcularEsperado({ edadRetiro:65, semanas:1800, salarioDiario:salario, hijos:2, padres:0, pareja:1 });
  if (!casiIgual(r, esperado)) throw new Error(`esperado ${esperado.toFixed(2)} vs ${r.toFixed(2)}`);
});

probar("Tope 100% >=2000 semanas", () => {
  const salario = 10 * SALARIO_MINIMO_DIARIO_GENERAL;
  const r = calcularPension(65, 2200, salario, 2, 0, 1);
  const esperado = calcularEsperado({ edadRetiro:65, semanas:2200, salarioDiario:salario, hijos:2, padres:0, pareja:1 });
  if (!casiIgual(r, esperado)) throw new Error(`esperado ${esperado.toFixed(2)} vs ${r.toFixed(2)}`);
});

console.log("\nPruebas finalizadas.");

