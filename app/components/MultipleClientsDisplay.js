'use client'
import { useState } from 'react'
import { calculatePensionData } from '../functions/calculatePensionData'
import ResultsDisplay from './ResultsDisplay'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function MultipleClientsDisplay({ clients }) {
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDetailedView, setShowDetailedView] = useState(false)

  const generateMultiClientPDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont(undefined, 'bold')
      pdf.text('Reporte de Pensiones IMSS - Múltiples Clientes', 20, 20)
      
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, 30)
      pdf.text(`Total de clientes: ${clients.length}`, 20, 40)
      
      let yPosition = 60
      
      clients.forEach((client, index) => {
        // Check if we need a new page
        if (yPosition > 200) {
          pdf.addPage()
          yPosition = 20
        }
        
        // Calculate results for this client
        const results = calculatePensionData(client, null, false)
        const hasComparison = results.some(r => r.pensionNormalMensual)
        
        // Client header
        pdf.setFontSize(16)
        pdf.setFont(undefined, 'bold')
        pdf.text(`Cliente ${index + 1}: ${client.nombre}`, 20, yPosition)
        yPosition += 15
        
        // Client data
        const clientData = [
          ['Edad actual', `${client.edad} años`],
          ['Edad de retiro', `${client.edadRetiro} años`],
          ['Semanas cotizadas', client.semanas],
          ['Salario promedio', `$${parseFloat(client.salarioPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
          ['Modalidad 40', client.modalidad40 ? 'Sí' : 'No']
        ]
        
        autoTable(pdf, {
          startY: yPosition,
          head: [['Concepto', 'Valor']],
          body: clientData,
          theme: 'grid',
          styles: { fontSize: 8 },
          margin: { left: 20 },
          tableWidth: 80
        })
        
        yPosition = pdf.lastAutoTable.finalY + 10
        
        // Results summary
        if (hasComparison) {
          const bestResult = results.find(r => r.edadRetiro == client.edadRetiro) || results[results.length - 1]
          const beneficio = parseFloat(bestResult.pensionMensual) - parseFloat(bestResult.pensionNormalMensual)
          
          pdf.setFontSize(10)
          pdf.setFont(undefined, 'bold')
          pdf.text(`Pensión sin Modalidad 40: $${parseFloat(bestResult.pensionNormalMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, yPosition)
          yPosition += 8
          pdf.text(`Pensión con Modalidad 40: $${parseFloat(bestResult.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, yPosition)
          yPosition += 8
          pdf.setFont(undefined, 'normal')
          pdf.text(`Aplica PMG (sin modalidad 40 / con modalidad 40): ${bestResult.aplicaPMGNormal ? 'Sí' : 'No'} / ${bestResult.aplicaPMG ? 'Sí' : 'No'}`, 20, yPosition)
          yPosition += 8
          pdf.text(`Antes de PMG (sin modalidad 40 / con modalidad 40): $${parseFloat(bestResult.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} / $${parseFloat(bestResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, 20, yPosition)
          yPosition += 10
          pdf.setTextColor(0, 128, 0)
          pdf.text(`Beneficio mensual: $${beneficio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, yPosition)
          pdf.setTextColor(0, 0, 0)
          yPosition += 20
        } else {
          const bestResult = results.find(r => r.edadRetiro == client.edadRetiro) || results[results.length - 1]
          pdf.setFontSize(10)
          pdf.setFont(undefined, 'bold')
          pdf.text(`Pensión mensual: $${parseFloat(bestResult.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, yPosition)
          yPosition += 8
          pdf.setFont(undefined, 'normal')
          pdf.text(`Aplica PMG: ${bestResult.aplicaPMG ? 'Sí' : 'No'}`, 20, yPosition)
          yPosition += 8
          pdf.text(`Antes de PMG: $${parseFloat(bestResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, 20, yPosition)
          yPosition += 20
        }
      })
      
      pdf.save(`pension-calculation-multiple-clients.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF. Por favor, intente nuevamente.')
    }
  }

  // Función para manejar la selección de cliente y mostrar vista detallada
  const handleClientSelect = (index) => {
    setSelectedClient(index)
    setShowDetailedView(true)
  }

  const handleBackToList = () => {
    setShowDetailedView(false)
    setSelectedClient(null)
  }

  // Si se está mostrando la vista detallada, renderizar el componente ResultsDisplay
  if (showDetailedView && selectedClient !== null) {
    const clientData = clients[selectedClient]
    const results = calculatePensionData(clientData, null, false)
    
    return (
      <div className="w-full">
        {/* Botón para regresar */}
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista de clientes
          </button>
        </div>
        
        {/* Componente de resultados detallados */}
        <ResultsDisplay results={results} formData={clientData} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Múltiples Clientes Cargados</h2>
          <button
            onClick={generateMultiClientPDF}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF Consolidado
          </button>
        </div>
        <p className="text-gray-600">Se han cargado {clients.length} clientes. Haga clic en un cliente para ver su análisis completo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {clients.map((client, index) => {
          const results = calculatePensionData(client, null, false)
          const hasComparison = results.some(r => r.pensionNormalMensual)
          const bestResult = results.find(r => r.edadRetiro == client.edadRetiro) || results[results.length - 1]
          
          return (
            <div 
              key={index}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedClient === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleClientSelect(index)}
            >
              <div className="font-semibold text-gray-900 mb-2">{client.nombre}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Edad: {client.edad} años</div>
                <div>Semanas: {client.semanas}</div>
                <div>Modalidad 40: {client.modalidad40 ? 'Sí' : 'No'}</div>
                {hasComparison ? (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                    <div className="font-medium text-green-800">
                      Beneficio: ${(parseFloat(bestResult.pensionMensual) - parseFloat(bestResult.pensionNormalMensual)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-gray-700">PMG</span>
                      <span className="text-gray-600">Sin modalidad 40:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${bestResult.aplicaPMGNormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {bestResult.aplicaPMGNormal ? 'Sí' : 'No'}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">Con modalidad 40:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${bestResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {bestResult.aplicaPMG ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium text-gray-700">
                      Pensión: ${parseFloat(bestResult.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-gray-700">Aplica PMG:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${bestResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {bestResult.aplicaPMG ? 'Sí' : 'No'}
                      </span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-700">Antes de PMG:</span>
                      <span className="font-semibold text-gray-900">${parseFloat(bestResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedClient !== null && (
        <div className="border-t pt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Análisis Detallado: {clients[selectedClient].nombre}
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-600 mb-4">
              Para ver el análisis completo con gráficas y tabla detallada, use el formulario individual 
              o genere el PDF consolidado para todos los clientes.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clients[selectedClient].edad}</div>
                <div className="text-sm text-gray-600">Edad Actual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clients[selectedClient].edadRetiro}</div>
                <div className="text-sm text-gray-600">Edad Retiro</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clients[selectedClient].semanas}</div>
                <div className="text-sm text-gray-600">Semanas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${parseFloat(clients[selectedClient].salarioPromedio).toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-gray-600">Salario Promedio</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
