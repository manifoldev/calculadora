'use client'
import { useState } from 'react'
import PensionForm from './components/PensionForm'
import ResultsDisplay from './components/ResultsDisplay'
import MultipleClientsDisplay from './components/MultipleClientsDisplay'
import { calculatePensionData } from './functions/calculatePensionData'

export default function Home() {
  const [results, setResults] = useState(null)
  const [formData, setFormData] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [useFileData, setUseFileData] = useState(false)
  const [multipleClients, setMultipleClients] = useState(null)

  const handleCalculate = (data) => {
    setFormData(data)
    const calculatedResults = calculatePensionData(data, fileData, false)
    setResults(calculatedResults)
    setUseFileData(false)
    setMultipleClients(null)
  }

  const handleFileData = (data) => {
    if (Array.isArray(data)) {
      // Multiple clients
      setMultipleClients(data)
      setResults(null)
      setFormData(null)
      setFileData(null)
    } else {
      // Single client
      setFileData(data)
      setUseFileData(true)
      const calculatedResults = calculatePensionData(null, data, true)
      setResults(calculatedResults)
      setFormData(data)
      setMultipleClients(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <PensionForm onCalculate={handleCalculate} onFileData={handleFileData} />
          </div>
        </div>
        
        {results && (
          <div className="flex justify-center mt-8">
            <ResultsDisplay results={results} formData={formData} />
          </div>
        )}
        
        {multipleClients && (
          <div className="flex justify-center mt-8">
            <MultipleClientsDisplay clients={multipleClients} />
          </div>
        )}
      </div>
    </div>
  )
}
