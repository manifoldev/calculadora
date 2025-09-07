
import { calcularSalarioPromedio } from "./calcularSalarioPromedio.js";
import { calcularPension } from "./calcularPension.js";

export const calculatePensionData = (formData, fileData, useFileData) => {	
  const source = useFileData && fileData  ? fileData : formData;
  console.log(source)
  const { nombre, edad, edadRetiro, semanas, salarioPromedio, hijos, padresDependientes, pareja, siguesCotizando, salarioCotizacion, modalidad40, edadModalidad40, salarioModalidad40 } = source;
	
  let pensionResults = [];

  const edades = [60, 61, 62, 63, 64, 65]
  if (!edades.includes(parseInt(edadRetiro))) {
    edades.push(parseInt(edadRetiro))
  }
  edades.sort((a, b) => a - b)
  
  edades.forEach((edadRetiro) => {
    let salario = calcularSalarioPromedio({
      edad,
      salarioPromedio: parseFloat(salarioPromedio),
      siguesCotizando,
      salarioCotizacion: parseFloat(salarioCotizacion),
      modalidad40,
      edadModalidad40: parseFloat(edadModalidad40),
      salarioModalidad40: parseFloat(salarioModalidad40),
      edadRetiro
    });

    let semanasTotales = parseInt(semanas);

    if (siguesCotizando && modalidad40) {
      semanasTotales += (edadRetiro-edad)*52;
    } else if (siguesCotizando) {
      semanasTotales += (edadRetiro-edad)*52;
    } else if (modalidad40) {
      semanasTotales += (edadRetiro-edadModalidad40)*52;
    }

    let det = calcularPension(edadRetiro, semanasTotales, salario, parseInt(hijos), parseInt(padresDependientes), pareja ? 1 : 0);
    if (modalidad40) {
      let pensionNormal=0;
      let detNormal = null;
      if (siguesCotizando) {
        salario = calcularSalarioPromedio({
                    edad,
                    salarioPromedio: parseFloat(salarioPromedio),
                    siguesCotizando,
                    salarioCotizacion: parseFloat(salarioCotizacion),
                    modalidad40:0,
                    edadModalidad40: parseFloat(edadModalidad40),
                    salarioModalidad40: 0,
                    edadRetiro
        });
        detNormal = calcularPension(edadRetiro, parseInt(semanas)+(edadRetiro-edad)*52, salario, parseInt(hijos), parseInt(padresDependientes), pareja ? 1 : 0);
      }else {
        detNormal = calcularPension(edadRetiro, parseInt(semanas), salarioPromedio, parseInt(hijos), parseInt(padresDependientes), pareja ? 1 : 0);
      }
      pensionResults.push({
        edadRetiro,
        pensionMensual: det.mensual.toFixed(2),
        pensionMensualAntesPMG: det.mensualAntesPMG.toFixed(2),
        aplicaPMG: det.aplicaPMG,
        pensionNormalMensual: detNormal.mensual.toFixed(2),
        pensionNormalMensualAntesPMG: detNormal.mensualAntesPMG.toFixed(2),
        aplicaPMGNormal: detNormal.aplicaPMG,
        semanasTotales,
        isDesiredAge: edadRetiro == parseInt(source.edadRetiro)
      })
    }else {
      pensionResults.push({
        edadRetiro,
        pensionMensual: det.mensual.toFixed(2),
        pensionMensualAntesPMG: det.mensualAntesPMG.toFixed(2),
        aplicaPMG: det.aplicaPMG,
        semanasTotales,
        isDesiredAge: edadRetiro == parseInt(source.edadRetiro)
      });
    }
  });

  return pensionResults;
};
