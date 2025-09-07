export function calcularSalarioPromedio(params) {
  const edad = Number(params.edad);
  const edadRetiro = Number(params.edadRetiro);
  const salarioPromedio = Number(params.salarioPromedio);
  const siguesCotizando = !!params.siguesCotizando;
  const modalidad40 = !!params.modalidad40;
  let salarioCotizacion = 0;
  let semanasPorCotizar = 0;
  let salarioModalidad40 = 0;
  let semanasModalidad40 = 0;
  let edadModalidad40 = Number(params.edadModalidad40);
  let semanasHastaRetiro = Math.max(0, (edadRetiro - edad) * 52);
  let semanasHastaModalidad40 = 0;
    
  if(!siguesCotizando && !modalidad40) {
    return salarioPromedio;
  }

  if(siguesCotizando) {
    salarioCotizacion = params.salarioCotizacion;
    semanasPorCotizar = Math.max(0, semanasHastaRetiro);
  }

  if (modalidad40) {
    salarioModalidad40 = Number(params.salarioModalidad40);
    // Si no viene definida o no es número, asumimos que inicia ya (semanas hasta modalidad 40 = 0)
    if (!Number.isFinite(edadModalidad40)) {
      semanasHastaModalidad40 = 0;
    } else {
      semanasHastaModalidad40 = Math.max(0, (edadModalidad40 - edad) * 52);
    }
    semanasModalidad40 = Math.max(0, semanasHastaRetiro - semanasHastaModalidad40);
    // Si no sigue cotizando, no hay semanas por cotizar antes de modalidad 40
    if (!siguesCotizando) {
      semanasPorCotizar = 0;
    } else {
      semanasPorCotizar = Math.max(0, semanasHastaModalidad40);
    }
  }

  // Cálculo corregido del promedio de las últimas 250 semanas
  const semanasModalidad40Usadas = Math.min(250, Math.max(0, semanasModalidad40));
  const semanasCotizacionUsadas = Math.min(250 - semanasModalidad40Usadas, Math.max(0, semanasPorCotizar));
  const semanasHistoricasUsadas = Math.max(0, 250 - semanasModalidad40Usadas - semanasCotizacionUsadas);
  
  let salario = (
    (salarioModalidad40 || 0) * semanasModalidad40Usadas +
    (salarioCotizacion || 0) * semanasCotizacionUsadas + 
    (salarioPromedio || 0) * semanasHistoricasUsadas
  ) / 250;

  return salario;
}
