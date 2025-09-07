'use client'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'

export default function PensionForm({ onCalculate, onFileData }) {
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    edadRetiro: '',
    semanas: '',
    salarioPromedio: '',
    hijos: '0',
    padresDependientes: '0',
    pareja: false,
    siguesCotizando: false,
    salarioCotizacion: '',
    modalidad40: false,
    edadModalidad40: '',
    salarioModalidad40: ''
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onCalculate(formData)
  }

  const normalizarBooleano = (val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val === 1
    if (val == null) return false
    const s = String(val).trim().toLowerCase()
    return ['si','sí','s','y','yes','true','verdadero','1','x'].includes(s)
  }

  const normalizarNumero = (val) => {
    if (typeof val === 'number') return val
    if (val == null || val === '') return ''
    let s = String(val).trim()
    // Remueve símbolos de moneda y espacios
    s = s.replace(/[^0-9,.-]/g, '')
    // Si tiene coma y no tiene punto, asume coma decimal (p. ej. 1234,56)
    if (s.includes(',') && !s.includes('.')) {
      s = s.replace(/\./g, '') // quita posibles separadores de miles con punto
      s = s.replace(',', '.')
    } else {
      // Quita separadores de miles con coma
      s = s.replace(/,(?=\d{3}(\D|$))/g, '')
    }
    const n = parseFloat(s)
    return isNaN(n) ? '' : n
  }

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        console.log('Datos del Excel:', jsonData)
        
        if (jsonData.length > 1) {
          const headers = jsonData[0]
          const clients = []
          
          console.log('Headers:', headers)
          console.log('All data:', jsonData)
          
          // Process all rows except the header
          for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
            const values = jsonData[rowIndex]
            
            // Skip empty rows
            if (!values || values.every(cell => !cell)) continue
            
            const clientData = {
              nombre: '',
              edad: '',
              edadRetiro: '',
              semanas: '',
              salarioPromedio: '',
              hijos: '0',
              padresDependientes: '0',
              pareja: false,
              siguesCotizando: false,
              salarioCotizacion: '',
              modalidad40: false,
              edadModalidad40: '',
              salarioModalidad40: ''
            }
            
            headers.forEach((header, index) => {
              if (!header) return
              const normalizedHeader = header.toString().toLowerCase().replace(/\s+/g, '').replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u')
              const value = values[index]
              
              switch(normalizedHeader) {
                case 'nombre':
                  clientData.nombre = value || ''
                  break
                case 'edad':
                  clientData.edad = normalizarNumero(value)
                  break
                case 'edadretiro':
                case 'edadderetiro':
                  clientData.edadRetiro = normalizarNumero(value)
                  break
                case 'semanas':
                case 'semanascotizadas':
                  clientData.semanas = normalizarNumero(value)
                  break
                case 'salariopromedio':
                case 'salario':
                  clientData.salarioPromedio = normalizarNumero(value)
                  break
                case 'hijos':
                case 'numerodehijos':
                  clientData.hijos = normalizarNumero(value) || '0'
                  break
                case 'padresdependientes':
                case 'padres':
                  clientData.padresDependientes = normalizarNumero(value) || '0'
                  break
                case 'pareja':
                case 'tienepareja':
                  clientData.pareja = normalizarBooleano(value)
                  break
                case 'siguescotizando':
                case 'cotizando':
                  clientData.siguesCotizando = normalizarBooleano(value)
                  break
                case 'salariocotizacion':
                case 'salarioactual':
                  clientData.salarioCotizacion = normalizarNumero(value)
                  break
                case 'modalidad40':
                case 'modalidad':
                  clientData.modalidad40 = normalizarBooleano(value)
                  break
                case 'usamodalidad40':
                case 'utilizamodalidad40':
                case 'aplicamodalidad40':
                  clientData.modalidad40 = normalizarBooleano(value)
                  break
                case 'edadmodalidad40':
                case 'edadmodalidad':
                  clientData.edadModalidad40 = normalizarNumero(value)
                  break
                case 'edadparainiciarmodalidad40':
                case 'iniciomodalidad40':
                case 'edadenm40':
                  clientData.edadModalidad40 = normalizarNumero(value)
                  break
                case 'salariomodalidad40':
                case 'salariomodalidad':
                  clientData.salarioModalidad40 = normalizarNumero(value)
                  break
                case 'salarioenmodalidad40':
                case 'salarioenm40':
                case 'sbcmodalidad40':
                  clientData.salarioModalidad40 = normalizarNumero(value)
                  break
                case 'siguescotizandohastaelretiro':
                  clientData.siguesCotizando = normalizarBooleano(value)
                  break
              }
            })
            
            // Only add clients with required data
            if (clientData.nombre && clientData.edad && clientData.edadRetiro && clientData.semanas && clientData.salarioPromedio) {
              clients.push(clientData)
            }
          }
          
          console.log('Clientes procesados:', clients)
          
          if (clients.length === 1) {
            // Single client - use normal flow
            setFormData(clients[0])
            onFileData(clients[0])
            alert('Cliente cargado exitosamente!')
          } else if (clients.length > 1) {
            // Multiple clients - pass array to parent
            onFileData(clients)
            alert(`${clients.length} clientes cargados exitosamente!`)
          } else {
            alert('No se encontraron clientes válidos en el archivo. Verifique que todas las columnas requeridas tengan datos.')
          }
        } else {
          alert('El archivo Excel debe contener al menos una fila de encabezados y una fila de datos.')
        }
      } catch (error) {
        console.error('Error procesando Excel:', error)
        alert('Error al procesar el archivo Excel. Verifique que el formato sea correcto.')
      }
    }
    
    reader.onerror = () => {
      alert('Error al leer el archivo.')
    }
    
    reader.readAsArrayBuffer(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calculadora de Pensiones IMSS</h1>
        <p className="text-gray-600">Calcule su pensión con o sin modalidad 40</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isDragActive ? 
            <p>Suelte el archivo Excel aquí...</p> : 
            <p>Arrastra un archivo Excel o <span className="text-blue-500">haz clic para seleccionar</span></p>
          }
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad actual
            </label>
            <input
              type="number"
              name="edad"
              value={formData.edad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad de retiro deseada
            </label>
            <input
              type="number"
              name="edadRetiro"
              value={formData.edadRetiro}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="60"
              max="70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semanas cotizadas
            </label>
            <input
              type="number"
              name="semanas"
              value={formData.semanas}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salario promedio diario de cotización ($)
            </label>
            <input
              type="number"
              name="salarioPromedio"
              value={formData.salarioPromedio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de hijos
            </label>
            <select
              name="hijos"
              value={formData.hijos}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {[...Array(11)].map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Padres dependientes
            </label>
            <select
              name="padresDependientes"
              value={formData.padresDependientes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="pareja"
              checked={formData.pareja}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Tiene pareja
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de cotización</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="siguesCotizando"
                checked={formData.siguesCotizando}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Sigue cotizando hasta el retiro
              </label>
            </div>

            {formData.siguesCotizando && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salario de cotización actual ($)
                </label>
                <input
                  type="number"
                  name="salarioCotizacion"
                  value={formData.salarioCotizacion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                name="modalidad40"
                checked={formData.modalidad40}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Modalidad 40
              </label>
            </div>

            {formData.modalidad40 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad para iniciar Modalidad 40
                  </label>
                  <input
                    type="number"
                    name="edadModalidad40"
                    value={formData.edadModalidad40}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    min={formData.edad || 1}
                    max={formData.edadRetiro || 70}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario en Modalidad 40 ($)
                  </label>
                  <input
                    type="number"
                    name="salarioModalidad40"
                    value={formData.salarioModalidad40}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
          >
            Calcular Pensión
          </button>
        </div>
      </form>
    </div>
  )
}
