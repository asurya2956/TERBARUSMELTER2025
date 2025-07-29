"use client"

import { useMemo } from 'react'
import { QualityData, PROCESSING_LOCATIONS } from '@/lib/data'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface QualityMetricsProps {
  data: QualityData[]
}

export default function QualityMetrics({ data }: QualityMetricsProps) {
  const metrics = useMemo(() => {
    return PROCESSING_LOCATIONS.map(location => {
      const locationData = data.filter(d => d.locationId === location.id)
      const total = locationData.length
      const passed = locationData.filter(d => d.status === 'PASS').length
      const warnings = locationData.filter(d => d.status === 'WARNING').length
      const failed = locationData.filter(d => d.status === 'FAIL').length
      
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
      const averageValue = total > 0 
        ? Math.round((locationData.reduce((sum, d) => sum + d.value, 0) / total) * 100) / 100 
        : 0

      const sortedData = locationData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      const recent = sortedData.slice(0, Math.floor(sortedData.length / 2))
      const previous = sortedData.slice(Math.floor(sortedData.length / 2))
      
      const recentPassRate = recent.length > 0 
        ? Math.round((recent.filter(d => d.status === 'PASS').length / recent.length) * 100) 
        : 0
      const previousPassRate = previous.length > 0 
        ? Math.round((previous.filter(d => d.status === 'PASS').length / previous.length) * 100) 
        : 0
      
      const trend = recentPassRate - previousPassRate

      return {
        ...location,
        total,
        passed,
        warnings,
        failed,
        passRate,
        averageValue,
        trend,
        status: passRate >= 90 ? 'excellent' : passRate >= 80 ? 'good' : passRate >= 60 ? 'warning' : 'critical'
      }
    })
  }, [data])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-600'
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return '📈'
    if (trend < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'text-green-400'
    if (trend < -5) return 'text-red-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">
                {metric.name}
              </h3>
              <p className="text-slate-400 text-xs">{metric.product}</p>
            </div>
            <Badge className={`${getStatusColor(metric.status)} text-white text-xs`}>
              {metric.passRate}%
            </Badge>
          </div>

          <div className="mb-3">
            <Progress value={metric.passRate} className="h-2 bg-slate-600" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Samples:</span>
                <span className="font-medium">{metric.total}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Passed:</span>
                <span className="font-medium">{metric.passed}</span>
              </div>
              <div className="flex justify-between text-yellow-400">
                <span>Warnings:</span>
                <span className="font-medium">{metric.warnings}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Failed:</span>
                <span className="font-medium">{metric.failed}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Avg Value:</span>
                <span className="font-medium">
                  {metric.averageValue}{metric.targetQuality.unit}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Target:</span>
                <span className="font-medium">
                  ≥{metric.targetQuality.minValue}{metric.targetQuality.unit}
                </span>
              </div>
              <div className={`flex justify-between ${getTrendColor(metric.trend)}`}>
                <span>Trend:</span>
                <span className="font-medium">
                  {getTrendIcon(metric.trend)} {metric.trend > 0 ? '+' : ''}{metric.trend}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
