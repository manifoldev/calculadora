import { calcularPension } from "../app/functions/calcularPension.js";
import { UMA_DIARIA, SALARIO_MINIMO_DIARIO_GENERAL } from "../app/functions/constantes2025.js";

function casiIgual(a, b, eps = 0.5) { return Math.abs(a - b) <= eps; }

function probar(nombre, fn) {
  try { fn(); console.log(`✔ ${nombre}`); } catch (e) { console.error(`✘ ${nombre}:`, e.message); process.exitCode = 1; }
}

function calcularEsperado({ edadRetiro, semanas, salarioDiario, hijos=0, padres=0, pareja=0 }) {
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
  let factor = 1;
  if (edadRetiro <= 60.5) factor = 0.75;
  else if (edadRetiro <= 61.5) factor = 0.8;
  else if (edadRetiro <= 62.5) factor = 0.85;
  else if (edadRetiro <= 63.5) factor = 0.9;
  else if (edadRetiro < 64.5) factor = 0.95;
  anual *= factor;
  let mensual = anual / 12;
  let pctTope = semanas < 1500 ? 0.85 : (semanas < 2000 ? 0.90 : 1.00);
  const mensualTope = (salarioBase * 365 / 12) * pctTope;
  mensual = Math.min(mensual, mensualTope);
  const PMG = SALARIO_MINIMO_DIARIO_GENERAL * 30;
  mensual = Math.max(mensual, PMG);
  return mensual;
}

function run() {
  const PMG = SALARIO_MINIMO_DIARIO_GENERAL * 30;
  // 1) PMG con 1 SMG, 500 semanas, 65 años
  const r1 = calcularPension(65, 500, SALARIO_MINIMO_DIARIO_GENERAL, 0, 0, 0);
  const e1 = calcularEsperado({ edadRetiro:65, semanas:500, salarioDiario:SALARIO_MINIMO_DIARIO_GENERAL });
  if (!casiIgual(r1, e1)) throw new Error(`Caso 1 esperado ${e1.toFixed(2)} vs ${r1.toFixed(2)}`);
  if (!casiIgual(r1, PMG)) throw new Error(`Caso 1 debe igualar PMG ${PMG.toFixed(2)} vs ${r1.toFixed(2)}`);
  console.log("✔ Caso 1 PMG correcto");

  // 2) Fracciones de año 26 y 27 semanas
  const sd = 2 * SALARIO_MINIMO_DIARIO_GENERAL;
  const r26 = calcularPension(65, 526, sd, 0, 0, 0);
  const e26 = calcularEsperado({ edadRetiro:65, semanas:526, salarioDiario:sd });
  if (!casiIgual(r26, e26)) throw new Error(`Caso 2 (26) ${e26.toFixed(2)} vs ${r26.toFixed(2)}`);
  const r27 = calcularPension(65, 527, sd, 0, 0, 0);
  const e27 = calcularEsperado({ edadRetiro:65, semanas:527, salarioDiario:sd });
  if (!(r27 > r26 && casiIgual(r27, e27))) throw new Error(`Caso 2 (27) ${e27.toFixed(2)} vs ${r27.toFixed(2)}`);
  console.log("✔ Caso 2 redondeo fracciones correcto");

  // 3) Topes 85%, 90%, 100%
  const alto = 10 * SALARIO_MINIMO_DIARIO_GENERAL;
  const r3a = calcularPension(65, 1200, alto, 3, 0, 1);
  const e3a = calcularEsperado({ edadRetiro:65, semanas:1200, salarioDiario:alto, hijos:3, padres:0, pareja:1 });
  if (!casiIgual(r3a, e3a)) throw new Error(`Caso 3a 85% ${e3a.toFixed(2)} vs ${r3a.toFixed(2)}`);
  console.log("✔ Caso 3a tope 85% correcto");

  const r3b = calcularPension(65, 1800, alto, 2, 0, 1);
  const e3b = calcularEsperado({ edadRetiro:65, semanas:1800, salarioDiario:alto, hijos:2, padres:0, pareja:1 });
  if (!casiIgual(r3b, e3b)) throw new Error(`Caso 3b 90% ${e3b.toFixed(2)} vs ${r3b.toFixed(2)}`);
  console.log("✔ Caso 3b tope 90% correcto");

  const r3c = calcularPension(65, 2200, alto, 2, 0, 1);
  const e3c = calcularEsperado({ edadRetiro:65, semanas:2200, salarioDiario:alto, hijos:2, padres:0, pareja:1 });
  if (!casiIgual(r3c, e3c)) throw new Error(`Caso 3c 100% ${e3c.toFixed(2)} vs ${r3c.toFixed(2)}`);
  console.log("✔ Caso 3c tope 100% correcto");

  console.log("\nTodas las pruebas pasaron");
}

run();

