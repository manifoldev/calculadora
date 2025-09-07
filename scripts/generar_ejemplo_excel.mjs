import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

function crearLibro(datos, nombreHoja = 'Datos') {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(datos)
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja)
  return wb
}

function guardarLibro(wb, rutaSalida) {
  const dir = path.dirname(rutaSalida)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  XLSX.writeFile(wb, rutaSalida)
}

const headers = [
  'Nombre',
  'Edad',
  'Edad Retiro',
  'Semanas',
  'Salario Promedio',
  'Hijos',
  'Padres Dependientes',
  'Pareja',
  'Sigues Cotizando',
  'Salario Cotizacion',
  'Modalidad 40',
  'Edad Modalidad 40',
  'Salario Modalidad 40'
]

const filasMultiples = [
  headers,
  // Caso 1: PMG (salario muy bajo) con M40 que recién supera PMG a 61+
  ['Ana PMG', 58, 60, 1200, 120, 0, 0, 'No', 'No', '', 'Sí', 59, 1000],
  // Caso 2: Beneficio claro de M40
  ['Bruno Beneficio', 59, 65, 1400, 500, 2, 0, 'Sí', 'Sí', 600, 'Sí', 60, 1800],
  // Caso 3: Sin M40
  ['Carla Base', 60, 65, 1800, 900, 1, 0, 'Sí', 'Sí', 900, 'No', '', ''],
  // Caso 4: Tope 25 UMA (salarios muy altos)
  ['Diego Tope', 58, 65, 2200, 4000, 0, 0, 'Sí', 'Sí', 3500, 'Sí', 60, 3000],
  // Caso 5: M40 tardío para probar 250 semanas
  ['Elena Tardío', 55, 62, 900, 700, 0, 0, 'Sí', 'Sí', 700, 'Sí', 61, 2000]
]

const filasUnico = [
  headers,
  ['Cliente Único', 58, 60, 1200, 500, 0, 0, 'No', 'Sí', 600, 'Sí', 59, 1200]
]

const wbMultiples = crearLibro(filasMultiples, 'Clientes')
const wbUnico = crearLibro(filasUnico, 'Cliente')

guardarLibro(wbMultiples, path.join('public', 'ejemplo_clientes.xlsx'))
guardarLibro(wbUnico, path.join('public', 'ejemplo_cliente_unico.xlsx'))

console.log('✓ Excel de ejemplo generado en public/ejemplo_clientes.xlsx y public/ejemplo_cliente_unico.xlsx')

