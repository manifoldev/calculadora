'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { useEffect, useState } from 'react'

export default function ResultsDisplay({ results, formData }) {
  const desiredAgeResult = results.find(r => r.isDesiredAge) || results[results.length - 1]
  const hasComparison = results.some(r => r.pensionNormalMensual)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const onChange = (e) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange)
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange)
    }
  }, [])
  const captureChart = async (chartId, opts = {}) => {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) return null
    
    try {
      const { forceWidth = 1100, forceHeight = 550 } = opts

      // Forzar tamaño fijo para PDF sin afectar el layout móvil
      const prevWidth = chartElement.style.width
      const prevHeight = chartElement.style.height
      chartElement.style.width = `${forceWidth}px`
      chartElement.style.height = `${forceHeight}px`
      // Esperar un frame para que Recharts se reajuste
      await new Promise(requestAnimationFrame)

      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        width: forceWidth,
        height: forceHeight
      })

      // Restaurar tamaño original del contenedor
      chartElement.style.width = prevWidth
      chartElement.style.height = prevHeight

      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        aspectRatio: canvas.width / canvas.height
      }
    } catch (error) {
      console.warn(`Could not capture chart ${chartId}:`, error)
      return null
    }
  }

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // HEADER PROFESIONAL CON LOGO CONCEPTUAL
      pdf.setFillColor(41, 128, 185) // Azul corporativo
      pdf.rect(0, 0, 210, 40, 'F') // Header azul más alto
      
      // Título principal en blanco - más a la izquierda
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont(undefined, 'bold')
      pdf.text('REPORTE DE ANÁLISIS PENSIONAL', 10, 16)
      
      // Subtítulo - más a la izquierda
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      pdf.text('Instituto Mexicano del Seguro Social - Ley 1973', 10, 26)
      
      // Información del documento en esquina derecha - más separado
      pdf.setFontSize(9)
      const fechaHoy = new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
      const horaHoy = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', minute: '2-digit' 
      })
      pdf.text(`Fecha: ${fechaHoy}`, 150, 16)
      pdf.text(`Hora: ${horaHoy}`, 150, 24)
      pdf.text('Página 1', 150, 32)
      
      // Resetear color de texto
      pdf.setTextColor(0, 0, 0)
      
      let yPosition = 55
      
      // INFORMACIÓN DEL BENEFICIARIO
      pdf.setFillColor(245, 245, 245) // Gris claro
      pdf.rect(15, yPosition, 180, 8, 'F')
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('INFORMACIÓN DEL BENEFICIARIO', 20, yPosition + 6)
      pdf.setTextColor(0, 0, 0)
      yPosition += 18
      
      // Nombre destacado si existe
      if (formData.nombre) {
        pdf.setFillColor(255, 248, 220) // Amarillo muy claro
        pdf.rect(15, yPosition, 180, 12, 'F')
        pdf.setFontSize(14)
        pdf.setFont(undefined, 'bold')
        pdf.text('BENEFICIARIO:', 20, yPosition + 5)
        pdf.setFont(undefined, 'normal')
        pdf.text(formData.nombre.toUpperCase(), 20, yPosition + 9)
        yPosition += 20
      }
      
      // Datos organizados en secciones
      const datosPersonales = [
        ['Edad actual', `${formData.edad} años`],
        ['Edad de retiro deseada', `${formData.edadRetiro} años`],
        ['Hijos beneficiarios', formData.hijos],
        ['Padres dependientes', formData.padresDependientes],
        ['Cónyuge/Concubina(o)', formData.pareja ? 'Sí' : 'No']
      ]
      
      const datosLaborales = [
        ['Semanas cotizadas acumuladas', `${parseInt(formData.semanas).toLocaleString()} semanas`],
        ['Salario promedio de cotización', `$${parseFloat(formData.salarioPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`],
        ['Continúa cotizando', formData.siguesCotizando ? 'Sí' : 'No'],
        ['Opta por Modalidad 40', formData.modalidad40 ? 'Sí' : 'No']
      ]
      
      if (formData.siguesCotizando && formData.salarioCotizacion) {
        datosLaborales.push(['Salario actual de cotización', `$${parseFloat(formData.salarioCotizacion).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`])
      }
      
      if (formData.modalidad40) {
        datosLaborales.push(['Edad para iniciar Modalidad 40', `${formData.edadModalidad40} años`])
        datosLaborales.push(['Salario en Modalidad 40', `$${parseFloat(formData.salarioModalidad40).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`])
      }
      
      // Tabla de datos personales
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.text('Datos Personales:', 20, yPosition)
      yPosition += 10
      
      autoTable(pdf, {
        startY: yPosition,
        head: [['Concepto', 'Información']],
        body: datosPersonales,
        theme: 'striped',
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { left: 20, right: 20 }
      })
      
      yPosition = pdf.lastAutoTable.finalY + 15
      
      // Tabla de datos laborales
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.text('Datos Laborales:', 20, yPosition)
      yPosition += 10
      
      autoTable(pdf, {
        startY: yPosition,
        head: [['Concepto', 'Información']],
        body: datosLaborales,
        theme: 'striped',
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { left: 20, right: 20 }
      })
      
      yPosition = pdf.lastAutoTable.finalY + 15

      // Estado PMG (edad deseada)
      const estadoPMGHead = hasComparison
        ? [['Indicador', 'Sin Modalidad 40', 'Con Modalidad 40']]
        : [['Indicador', 'Valor']]
      const estadoPMGBody = hasComparison
        ? [
            ['Aplica PMG', desiredAgeResult.aplicaPMGNormal ? 'Sí' : 'No', desiredAgeResult.aplicaPMG ? 'Sí' : 'No'],
            ['Pensión antes de PMG', `$${parseFloat(desiredAgeResult.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX')}`, `$${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX')}`]
          ]
        : [
            ['Aplica PMG', desiredAgeResult.aplicaPMG ? 'Sí' : 'No'],
            ['Pensión antes de PMG', `$${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX')}`]
          ]

      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.text('Estado de PMG (Edad Deseada):', 20, yPosition)
      yPosition += 8

      autoTable(pdf, {
        startY: yPosition,
        head: estadoPMGHead,
        body: estadoPMGBody,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41,128,185], textColor: 255, fontStyle: 'bold' },
        margin: { left: 20, right: 20 }
      })

      yPosition = pdf.lastAutoTable.finalY + 20
      
      // Verificar si necesitamos nueva página
      if (yPosition > 180) {
        pdf.addPage()
        yPosition = 30
      }
      
      // SECCIÓN DE ANÁLISIS GRÁFICO
      if (hasComparison) {
        pdf.setFillColor(245, 245, 245) // Gris claro
        pdf.rect(15, yPosition, 180, 8, 'F')
        pdf.setFontSize(16)
        pdf.setFont(undefined, 'bold')
        pdf.setTextColor(41, 128, 185)
        pdf.text('ANÁLISIS COMPARATIVO DE BENEFICIOS', 20, yPosition + 6)
        pdf.setTextColor(0, 0, 0)
        yPosition += 18
        
        // Capture line chart
        const lineChartData = await captureChart('line-chart', { forceWidth: 1100, forceHeight: 550 })
        if (lineChartData) {
          pdf.setFontSize(12)
          pdf.setFont(undefined, 'bold')
          pdf.text('Proyección de Pensión por Edad de Retiro', 20, yPosition)
          yPosition += 8
          
          // Calculate proportional dimensions for PDF
          const maxWidth = 170 // Max width in PDF (mm)
          const maxHeight = 100 // Max height in PDF (mm)
          let imgWidth = maxWidth
          let imgHeight = maxWidth / lineChartData.aspectRatio
          
          // If height exceeds max, scale down
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = maxHeight * lineChartData.aspectRatio
          }
          
          // Centrar la imagen
          const xOffset = (210 - imgWidth) / 2
          pdf.addImage(lineChartData.dataUrl, 'PNG', xOffset, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 15
        }
        
        // Verificar espacio antes de la segunda gráfica
        if (yPosition > 200) {
          pdf.addPage()
          yPosition = 30
        }
        
        // Capture bar chart
        const barChartData = await captureChart('bar-chart', { forceWidth: 1100, forceHeight: 520 })
        if (barChartData) {
          pdf.setFontSize(12)
          pdf.setFont(undefined, 'bold')
          pdf.text('Beneficio Económico por Modalidad 40', 20, yPosition)
          yPosition += 8
          
          // Calculate proportional dimensions for PDF
          const maxWidth = 170 // Max width in PDF (mm)
          const maxHeight = 90 // Max height in PDF (mm)
          let imgWidth = maxWidth
          let imgHeight = maxWidth / barChartData.aspectRatio
          
          // If height exceeds max, scale down
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = maxHeight * barChartData.aspectRatio
          }
          
          // Centrar la imagen
          const xOffset = (210 - imgWidth) / 2
          pdf.addImage(barChartData.dataUrl, 'PNG', xOffset, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 20
        }
      }
      
      // Verificar si necesitamos nueva página para la tabla
      if (yPosition > 200) {
        pdf.addPage()
        yPosition = 30
      }
      
      // SECCIÓN DE RESULTADOS DETALLADOS
      pdf.setFillColor(245, 245, 245) // Gris claro
      pdf.rect(15, yPosition, 180, 8, 'F')
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('RESULTADOS DETALLADOS POR EDAD DE RETIRO', 20, yPosition + 6)
      pdf.setTextColor(0, 0, 0)
      yPosition += 18
      
      let tableHead, tableBody, alternateColors = true
      
      if (hasComparison) {
        tableHead = [[
          'Edad de Retiro', 'Semanas Totales',
          'Sin Modalidad 40', 'Con Modalidad 40',
          'Aplica PMG (sin modalidad 40 / con modalidad 40)', 'Pensión antes de PMG (sin modalidad 40 / con modalidad 40)',
          'Beneficio Mensual', 'Beneficio Anual'
        ]]
        tableBody = results.map((result, index) => {
          const row = [
            result.isDesiredAge ? `${result.edadRetiro} años ★` : `${result.edadRetiro} años`,
            result.semanasTotales.toLocaleString(),
            `$${parseFloat(result.pensionNormalMensual).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
            `$${parseFloat(result.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
            `${result.aplicaPMGNormal ? 'Sí' : 'No'} / ${result.aplicaPMG ? 'Sí' : 'No'}`,
            `$${parseFloat(result.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} / $${parseFloat(result.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
            `$${(parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
            `$${((parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)) * 12).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
          ]
          return row
        })
      } else {
        tableHead = [['Edad de Retiro', 'Semanas Totales', 'Pensión Mensual', 'Aplica PMG', 'Pensión antes de PMG']]
        tableBody = results.map(result => [
          result.isDesiredAge ? `${result.edadRetiro} años ★` : `${result.edadRetiro} años`,
          result.semanasTotales.toLocaleString(),
          `$${parseFloat(result.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
          result.aplicaPMG ? 'Sí' : 'No',
          `$${parseFloat(result.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
        ])
      }
      
      autoTable(pdf, {
        startY: yPosition,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          }
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        }
      })
      
      // SECCIÓN DE CONCLUSIONES Y RECOMENDACIONES
      let finalY = pdf.lastAutoTable.finalY + 20
      if (finalY > 250) {
        pdf.addPage()
        finalY = 30
      }
      pdf.setFillColor(245, 245, 245)
      pdf.rect(15, finalY, 180, 8, 'F')
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('CONCLUSIONES Y RECOMENDACIONES', 20, finalY + 6)
      pdf.setTextColor(0, 0, 0)
      finalY += 20
      
      if (hasComparison) {
        const avgBenefit = results.reduce((sum, result) => 
          sum + (parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)), 0
        ) / results.length
        
        const desiredAgeResult = results.find(r => r.isDesiredAge)
        const beneficioDeseado = desiredAgeResult ? 
          (parseFloat(desiredAgeResult.pensionMensual) - parseFloat(desiredAgeResult.pensionNormalMensual)) : 0
        
        // Conclusión principal
        pdf.setFillColor(220, 255, 220) // Verde muy claro
        pdf.rect(15, finalY, 180, 25, 'F')
        
        pdf.setFontSize(12)
        pdf.setFont(undefined, 'bold')
        pdf.text('RECOMENDACIÓN PRINCIPAL:', 20, finalY + 8)
        pdf.setFont(undefined, 'normal')
        pdf.text(`La Modalidad 40 representa una estrategia financiera favorable para`, 20, finalY + 15)
        pdf.text(`incrementar significativamente su pensión mensual.`, 20, finalY + 22)
        finalY += 35
        
        // Beneficios cuantificados
        pdf.setFontSize(11)
        pdf.setFont(undefined, 'bold')
        pdf.text('BENEFICIOS CUANTIFICADOS:', 20, finalY)
        finalY += 8
        
        pdf.setFont(undefined, 'normal')
        pdf.text(`• Beneficio mensual promedio: $${avgBenefit.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`, 25, finalY)
        finalY += 8
        pdf.text(`• Beneficio anual promedio: $${(avgBenefit * 12).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`, 25, finalY)
        finalY += 8
        if (desiredAgeResult) {
          pdf.text(`• A los ${formData.edadRetiro} años (edad deseada):`, 25, finalY)
          finalY += 5
          pdf.text(`  $${beneficioDeseado.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN adicionales mensuales`, 25, finalY)
          finalY += 8
        }
      } else {
        const desiredAgeResult = results.find(r => r.isDesiredAge)
        pdf.setFontSize(12)
        pdf.setFont(undefined, 'bold')
        pdf.text('PROYECCIÓN DE PENSIÓN:', 20, finalY)
        finalY += 10
        pdf.setFont(undefined, 'normal')
        if (desiredAgeResult) {
          pdf.text(`Su pensión mensual proyectada a los ${formData.edadRetiro} años será de:`, 20, finalY)
          finalY += 10
          pdf.setFont(undefined, 'bold')
          pdf.setFontSize(14)
          pdf.text(`$${parseFloat(desiredAgeResult.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`, 20, finalY)
          finalY += 8
        }
      }
      
      // Disclaimer legal (verificar espacio)
      finalY += 20
      if (finalY + 28 > pdf.internal.pageSize.getHeight() - 10) {
        pdf.addPage()
        finalY = 30
      }
      pdf.setFillColor(255, 248, 220) // Amarillo muy claro
      pdf.rect(15, finalY, 180, 20, 'F')
      pdf.setFontSize(9)
      pdf.setFont(undefined, 'italic')
      pdf.text('IMPORTANTE: Este análisis está basado en las disposiciones actuales de la Ley del Seguro', 20, finalY + 7)
      pdf.text('Social de 1973 y valores vigentes para 2025. Los resultados son estimativos y pueden', 20, finalY + 12)
      pdf.text('variar según modificaciones legislativas futuras. Se recomienda consultar al IMSS.', 20, finalY + 17)
      
      // Footer del documento (pegado al fondo de la página actual)
      const footerY = pdf.internal.pageSize.getHeight() - 12
      pdf.setFillColor(41, 128, 185)
      pdf.rect(0, footerY - 5, 210, 15, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text('Generado por Sistema de Cálculo Pensional IMSS', 20, footerY + 2)
      pdf.text(`Pág. ${pdf.getNumberOfPages()}`, 180, footerY + 2)
      
      // Nombre del archivo más descriptivo
      const nombreArchivo = formData.nombre 
        ? `analisis-pensional-${formData.nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
        : `analisis-pensional-${new Date().toISOString().split('T')[0]}.pdf`
      
      pdf.save(nombreArchivo)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF. Por favor, intente nuevamente.')
    }
  }

  const chartData = results.map(result => ({
    edad: result.edadRetiro,
    pensionConModalidad40: result.pensionMensual ? parseFloat(result.pensionMensual) : 0,
    pensionSinModalidad40: result.pensionNormalMensual ? parseFloat(result.pensionNormalMensual) : parseFloat(result.pensionMensual),
    diferencia: result.pensionNormalMensual ? 
      (parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)) : 0
  }))

  // hasComparison definido al inicio del componente

  return (
    <div id="results-container" className="bg-white rounded-lg shadow-xl p-8 w-full">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Resultados del Cálculo</h2>
          <button
            onClick={generatePDF}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
        {formData.nombre && (
          <p className="text-gray-600">Cliente: <span className="font-semibold">{formData.nombre}</span></p>
        )}
      </div>

      {/* Resumen Edad Deseada (monto principal con badge PMG) */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-gray-800 font-semibold">
            Edad deseada: {desiredAgeResult.edadRetiro} años
          </div>
          {hasComparison ? (
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="text-gray-700">
                <span className="text-gray-500 mr-2">Sin modalidad 40:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${parseFloat(desiredAgeResult.pensionNormalMensual).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </span>
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${desiredAgeResult.aplicaPMGNormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`} title="Pensión mínima garantizada">
                  {desiredAgeResult.aplicaPMGNormal ? 'Topado por PMG' : 'Sin tope PMG'}
                </span>
              </div>
              <div className="text-gray-700">
                <span className="text-gray-500 mr-2">Con modalidad 40:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${parseFloat(desiredAgeResult.pensionMensual).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </span>
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`} title="Pensión mínima garantizada">
                  {desiredAgeResult.aplicaPMG ? 'Topado por PMG' : 'Sin tope PMG'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-700">
              <span className="text-gray-500 mr-2">Pensión:</span>
              <span className="text-xl font-bold text-gray-900">
                ${parseFloat(desiredAgeResult.pensionMensual).toLocaleString('es-MX', {minimumFractionDigits: 2})}
              </span>
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`} title="Pensión mínima garantizada">
                {desiredAgeResult.aplicaPMG ? 'Topado por PMG' : 'Sin tope PMG'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas resumen PMG (edad deseada) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {hasComparison ? (
          <>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-600 mb-1">Aplica PMG (edad deseada)</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Sin:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${desiredAgeResult.aplicaPMGNormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {desiredAgeResult.aplicaPMGNormal ? 'Sí' : 'No'}
                </span>
                <span className="mx-1 text-gray-400">/</span>
                <span className="text-gray-600">Con:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {desiredAgeResult.aplicaPMG ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-600 mb-1">Pensión antes de PMG (edad deseada)</div>
              <div className="text-lg font-semibold text-gray-900">
                ${parseFloat(desiredAgeResult.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 0})}
                <span className="mx-1 text-gray-400">/</span>
                ${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 0})}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-600 mb-1">Aplica PMG (edad deseada)</div>
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {desiredAgeResult.aplicaPMG ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-600 mb-1">Pensión antes de PMG (edad deseada)</div>
              <div className="text-lg font-semibold text-gray-900">
                ${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 0})}
              </div>
            </div>
          </>
        )}
      </div>

      {hasComparison && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Comparativo: Con vs Sin Modalidad 40</h3>
          <div id="line-chart" className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={isMobile ? 360 : 450} minHeight={280} className="sm:h-96 h-80">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 70 : 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="edad" 
                  label={{ value: 'Edad de Retiro', position: 'insideBottom', offset: -5 }}
                  height={isMobile ? 50 : 40}
                />
                <YAxis 
                  label={{ value: 'Pensión Mensual ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={isMobile ? 60 : 80}
                />
                <Tooltip 
                  formatter={(value, name) => [`$${parseFloat(value).toLocaleString()}`, name]}
                  labelFormatter={(label) => `Edad: ${label} años`}
                />
                <Legend verticalAlign={isMobile ? 'bottom' : 'top'} height={isMobile ? 48 : 24} wrapperStyle={{ paddingTop: isMobile ? 8 : 0 }} />
                <Line 
                  type="monotone" 
                  dataKey="pensionConModalidad40" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  name="Con Modalidad 40"
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: isMobile ? 3 : 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pensionSinModalidad40" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  name="Sin Modalidad 40"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: isMobile ? 3 : 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasComparison && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Diferencia de Pensión por Edad</h3>
          <div id="bar-chart" className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={isMobile ? 300 : 350} minHeight={240} className="sm:h-80 h-64">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 70 : 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="edad" 
                  label={{ value: 'Edad de Retiro', position: 'insideBottom', offset: -5 }}
                  height={isMobile ? 50 : 40}
                />
                <YAxis 
                  label={{ value: 'Diferencia ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={isMobile ? 60 : 80}
                />
                <Tooltip 
                  formatter={(value) => [`$${parseFloat(value).toLocaleString()}`, 'Beneficio Modalidad 40']}
                  labelFormatter={(label) => `Edad: ${label} años`}
                />
                <Legend verticalAlign={isMobile ? 'bottom' : 'top'} height={isMobile ? 48 : 24} wrapperStyle={{ paddingTop: isMobile ? 8 : 0 }} />
                <Bar 
                  dataKey="diferencia" 
                  fill="#16a34a"
                  name="Beneficio Modalidad 40"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Detalle de Cálculos</h3>
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Edad de Retiro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Semanas Totales
              </th>
              {hasComparison && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pensión Sin Modalidad 40</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pensión Con Modalidad 40</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Aplica PMG (Sin/Con)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Antes de PMG (Sin/Con)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Beneficio Mensual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Beneficio Anual</th>
                </>
              )}
              {!hasComparison && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pensión Mensual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Aplica PMG</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Antes de PMG</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className={`hover:bg-gray-50 ${result.isDesiredAge ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${result.isDesiredAge ? 'text-yellow-800 font-bold' : 'text-gray-900'}`}>
                  {result.edadRetiro} años {result.isDesiredAge && '(Edad deseada)'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.semanasTotales.toLocaleString()}
                </td>
                {hasComparison && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(result.pensionNormalMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${result.isDesiredAge ? 'text-yellow-700' : 'text-blue-600'}`}>${parseFloat(result.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-gray-600 mr-1">Sin modalidad 40:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${result.aplicaPMGNormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {result.aplicaPMGNormal ? 'Sí' : 'No'}
                      </span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span className="text-gray-600 mr-1">Con modalidad 40:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${result.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {result.aplicaPMG ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(result.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} / ${parseFloat(result.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${(parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${((parseFloat(result.pensionMensual) - parseFloat(result.pensionNormalMensual)) * 12).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </>
                )}
                {!hasComparison && (
                  <>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${result.isDesiredAge ? 'text-yellow-700' : 'text-blue-600'}`}>${parseFloat(result.pensionMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${result.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {result.aplicaPMG ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(result.pensionMensualAntesPMG||0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cómo se calculó (desglose) */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cómo se calculó</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Entradas y promedios</div>
            {hasComparison ? (
              <ul className="text-sm text-gray-800 space-y-1">
                <li>
                  <span className="text-gray-500" title="Promedio de las últimas 250 semanas">Salario promedio 250 semanas:</span>
                  <span className="ml-2 font-semibold">${parseFloat(desiredAgeResult.salarioPromedio250Normal||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="font-semibold">${parseFloat(desiredAgeResult.salarioPromedio250||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Tope de 25 UMA">Salario base utilizado:</span>
                  <span className="ml-2">${parseFloat(desiredAgeResult.salarioBaseUtilizadoNormal||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span>${parseFloat(desiredAgeResult.salarioBaseUtilizado||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Semanas acumuladas al llegar a la edad">Semanas totales:</span>
                  <span className="ml-2">{desiredAgeResult.semanasTotales.toLocaleString()}</span>
                </li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-800 space-y-1">
                <li>
                  <span className="text-gray-500" title="Promedio de las últimas 250 semanas">Salario promedio 250 semanas:</span>
                  <span className="ml-2 font-semibold">${parseFloat(desiredAgeResult.salarioPromedio250||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Tope de 25 UMA">Salario base utilizado:</span>
                  <span className="ml-2">${parseFloat(desiredAgeResult.salarioBaseUtilizado||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Semanas acumuladas al llegar a la edad">Semanas totales:</span>
                  <span className="ml-2">{desiredAgeResult.semanasTotales.toLocaleString()}</span>
                </li>
              </ul>
            )}
          </div>

          {/* Columna derecha */}
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Resultados intermedios</div>
            {hasComparison ? (
              <ul className="text-sm text-gray-800 space-y-1">
                <li>
                  <span className="text-gray-500" title="Antes de aplicar el piso de PMG">Pensión antes de PMG:</span>
                  <span className="ml-2 font-semibold">${parseFloat(desiredAgeResult.pensionNormalMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="font-semibold">${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Aplicación del piso de PMG">Aplica PMG:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded font-semibold ${desiredAgeResult.aplicaPMGNormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>Sin modalidad 40: {desiredAgeResult.aplicaPMGNormal ? 'Sí' : 'No'}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>Con modalidad 40: {desiredAgeResult.aplicaPMG ? 'Sí' : 'No'}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Factor por edad 60–65">Factor por edad:</span>
                  <span className="ml-2">{
                    desiredAgeResult.edadRetiro <= 60.5 ? '0.75' :
                    desiredAgeResult.edadRetiro <= 61.5 ? '0.80' :
                    desiredAgeResult.edadRetiro <= 62.5 ? '0.85' :
                    desiredAgeResult.edadRetiro <= 63.5 ? '0.90' :
                    desiredAgeResult.edadRetiro < 64.5 ? '0.95' : '1.00'
                  }</span>
                </li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-800 space-y-1">
                <li>
                  <span className="text-gray-500" title="Antes de aplicar el piso de PMG">Pensión antes de PMG:</span>
                  <span className="ml-2 font-semibold">${parseFloat(desiredAgeResult.pensionMensualAntesPMG||0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Aplicación del piso de PMG">Aplica PMG:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded font-semibold ${desiredAgeResult.aplicaPMG ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{desiredAgeResult.aplicaPMG ? 'Sí' : 'No'}</span>
                </li>
                <li>
                  <span className="text-gray-500" title="Factor por edad 60–65">Factor por edad:</span>
                  <span className="ml-2">{
                    desiredAgeResult.edadRetiro <= 60.5 ? '0.75' :
                    desiredAgeResult.edadRetiro <= 61.5 ? '0.80' :
                    desiredAgeResult.edadRetiro <= 62.5 ? '0.85' :
                    desiredAgeResult.edadRetiro <= 63.5 ? '0.90' :
                    desiredAgeResult.edadRetiro < 64.5 ? '0.95' : '1.00'
                  }</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
      {hasComparison && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-lg font-semibold text-green-800 mb-2">Recomendación</h4>
          <p className="text-green-700">
            Basado en los cálculos, la Modalidad 40 del IMSS puede ofrecer beneficios significativos en su pensión. 
            El beneficio promedio mensual es de ${(chartData.reduce((sum, item) => sum + item.diferencia, 0) / chartData.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}.
          </p>
        </div>
      )}
    </div>
  )
}
