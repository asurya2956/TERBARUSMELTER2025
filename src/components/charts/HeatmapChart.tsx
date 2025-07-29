"use client"

import { useMemo } from 'react'
import { QualityData, PROCESSING_LOCATIONS } from '@/lib/data'

interface HeatmapChartProps {
  data: QualityData[]
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const heatmapData = useMemo(() => {
    // Group data by location and date
    const groupedData: { [key: string]: { [key: string]: QualityData[] } } = {}
    
    data.forEach(item => {
      const date = item.date
      const location = item.location
      
      if (!groupedData[location]) {
        groupedData[location] = {}
      }
      if (!groupedData[location][date]) {
        groupedData[location][date] = []
      }
      groupedData[location][date].push(item)
    })

    // Get unique dates and locations
    const uniqueDates = [...new Set(data.map(d => d.date))].sort().slice(-14) // Last 14 days
    const uniqueLocations = PROCESSING_LOCATIONS.map(loc => loc.name)

    // Create heatmap matrix
    const matrix = uniqueLocations.map(location => {
      return uniqueDates.map(date => {
        const locationData = groupedData[location]?.[date] || []
        let passRate = 0
        
        if (locationData.length > 0) {
          const passCount = locationData.filter(d => d.status === 'PASS').length
          passRate = Math.round((passCount / locationData.length) * 100)
        }
        
        return {
          location,
          date,
          passRate,
          sampleCount: locationData.length,
          status: passRate >= 90 ? 'excellent' : passRate >= 80 ? 'good' : passRate >= 60 ? 'warning' : 'critical'
        }
      })
    })

    return { matrix, uniqueDates, uniqueLocations }
  }, [data])

  const getColorClass = (passRate: number) => {
    if (passRate >= 90) return 'bg-green-500'
    if (passRate >= 80) return 'bg-green-400'
    if (passRate >= 60) return 'bg-yellow-500'
    if (passRate >= 40) return 'bg-orange-500'
    if (passRate > 0) return 'bg-red-500'
    return 'bg-slate-600'
  }

  const getIntensity = (passRate: number) => {
    if (passRate >= 90) return 'opacity-100'
    if (passRate >= 80) return 'opacity-90'
    if (passRate >= 60) return 'opacity-80'
    if (passRate >= 40) return 'opacity-70'
    if (passRate > 0) return 'opacity-60'
    return 'opacity-30'
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with dates */}
          <div className="grid grid-cols-[200px_1fr] gap-1 mb-2">
            <div className="text-slate-400 text-sm font-medium">Location</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${heatmapData.uniqueDates.length}, 1fr)` }}>
              {heatmapData.uniqueDates.map(date => (
                <div key={date} className="text-slate-400 text-xs text-center p-1">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {heatmapData.matrix.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-[200px_1fr] gap-1">
                <div className="text-slate-300 text-sm p-2 bg-slate-700/30 rounded flex items-center">
                  <span className="truncate" title={heatmapData.uniqueLocations[rowIndex]}>
                    {heatmapData.uniqueLocations[rowIndex].length > 25 
                      ? heatmapData.uniqueLocations[rowIndex].substring(0, 25) + '...'
                      : heatmapData.uniqueLocations[rowIndex]
                    }
                  </span>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${heatmapData.uniqueDates.length}, 1fr)` }}>
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className={`
                        h-12 rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 relative
                        ${getColorClass(cell.passRate)} ${getIntensity(cell.passRate)}
                        ${cell.sampleCount === 0 ? 'bg-slate-600 opacity-30' : ''}
                      `}
                      title={`${cell.location}\nDate: ${new Date(cell.date).toLocaleDateString()}\nPass Rate: ${cell.passRate}%\nSamples: ${cell.sampleCount}`}
                    >
                      {cell.sampleCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {cell.passRate}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>0-40% Pass Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>40-60% Pass Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>60-80% Pass Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>80-90% Pass Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>90-100% Pass Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-slate-600 opacity-30 rounded"></div>
          <span>No Data</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-green-400 text-lg font-bold">
            {heatmapData.matrix.flat().filter(cell => cell.passRate >= 90).length}
          </div>
          <div className="text-slate-400 text-xs">Excellent Days</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-yellow-400 text-lg font-bold">
            {heatmapData.matrix.flat().filter(cell => cell.passRate >= 60 && cell.passRate < 90).length}
          </div>
          <div className="text-slate-400 text-xs">Warning Days</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-red-400 text-lg font-bold">
            {heatmapData.matrix.flat().filter(cell => cell.passRate > 0 && cell.passRate < 60).length}
          </div>
          <div className="text-slate-400 text-xs">Critical Days</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-lg font-bold">
            {heatmapData.matrix.flat().filter(cell => cell.sampleCount === 0).length}
          </div>
          <div className="text-slate-400 text-xs">No Data Days</div>
        </div>
      </div>
    </div>
  )
}
