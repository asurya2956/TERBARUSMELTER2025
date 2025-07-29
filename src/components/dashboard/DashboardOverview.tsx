"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROCESSING_LOCATIONS, SAMPLE_DATA, getLocationStats, getRecentData, getAlerts } from '@/lib/data'
import HeatmapChart from '@/components/charts/HeatmapChart'
import QualityMetrics from '@/components/charts/QualityMetrics'

export default function DashboardOverview() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7')
  const [recentData, setRecentData] = useState(getRecentData(7))
  const [alerts, setAlerts] = useState(getAlerts())

  useEffect(() => {
    setRecentData(getRecentData(parseInt(selectedTimeRange)))
  }, [selectedTimeRange])

  // Calculate overall statistics
  const totalSamples = recentData.length
  const passedSamples = recentData.filter(d => d.status === 'PASS').length
  const warningSamples = recentData.filter(d => d.status === 'WARNING').length
  const failedSamples = recentData.filter(d => d.status === 'FAIL').length
  const overallPassRate = totalSamples > 0 ? Math.round((passedSamples / totalSamples) * 100) : 0

  // Get location statistics
  const locationStats = PROCESSING_LOCATIONS.map(location => ({
    ...location,
    stats: getLocationStats(location.id)
  }))

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quality Overview</h1>
          <p className="text-slate-400">Real-time monitoring of all processing locations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-orange-600 hover:bg-orange-700"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Samples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalSamples}</div>
            <p className="text-xs text-slate-400">Last {selectedTimeRange} days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{overallPassRate}%</div>
            <p className="text-xs text-slate-400">{passedSamples} passed samples</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{warningSamples}</div>
            <p className="text-xs text-slate-400">Samples below target</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{failedSamples}</div>
            <p className="text-xs text-slate-400">Critical quality issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap and Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Process Quality Heatmap</CardTitle>
            <CardDescription className="text-slate-400">
              Visual representation of quality levels across all processing locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapChart data={recentData} />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quality Metrics</CardTitle>
            <CardDescription className="text-slate-400">
              Performance indicators by location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QualityMetrics data={recentData} />
          </CardContent>
        </Card>
      </div>

      {/* Location Status Grid */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Processing Locations Status</CardTitle>
          <CardDescription className="text-slate-400">
            Current status and performance of all processing locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationStats.map((location) => (
              <div
                key={location.id}
                className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white text-sm">{location.name}</h3>
                  <Badge
                    variant={
                      location.stats.passRate >= 90 ? 'default' :
                      location.stats.passRate >= 80 ? 'secondary' : 'destructive'
                    }
                    className={
                      location.stats.passRate >= 90 ? 'bg-green-600' :
                      location.stats.passRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                    }
                  >
                    {location.stats.passRate}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-2">{location.product}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Samples:</span>
                    <span>{location.stats.total}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Passed:</span>
                    <span>{location.stats.passed}</span>
                  </div>
                  <div className="flex justify-between text-yellow-400">
                    <span>Warnings:</span>
                    <span>{location.stats.warnings}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Failed:</span>
                    <span>{location.stats.failed}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-600">
                    <span>Avg Value:</span>
                    <span>{location.stats.averageValue}{location.targetQuality.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Alerts</CardTitle>
          <CardDescription className="text-slate-400">
            Latest quality issues requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={alert.status === 'FAIL' ? 'destructive' : 'secondary'}
                    className={alert.status === 'FAIL' ? 'bg-red-600' : 'bg-yellow-600'}
                  >
                    {alert.status}
                  </Badge>
                  <div>
                    <p className="text-white font-medium text-sm">{alert.location}</p>
                    <p className="text-slate-400 text-xs">{alert.product}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {alert.value}{alert.unit}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Target: ≥{alert.targetMin}{alert.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
