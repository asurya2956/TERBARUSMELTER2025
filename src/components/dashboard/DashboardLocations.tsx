"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROCESSING_LOCATIONS, SAMPLE_DATA, getLocationStats } from '@/lib/data'

export default function DashboardLocations() {
  const [selectedLocation, setSelectedLocation] = useState(PROCESSING_LOCATIONS[0].id)

  const locationData = useMemo(() => {
    return PROCESSING_LOCATIONS.map(location => {
      const stats = getLocationStats(location.id)
      const recentSamples = SAMPLE_DATA
        .filter(d => d.locationId === location.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      // Calculate daily trends (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const dailyTrends = last7Days.map(date => {
        const dayData = SAMPLE_DATA.filter(d => 
          d.locationId === location.id && d.date === date
        )
        const passCount = dayData.filter(d => d.status === 'PASS').length
        const passRate = dayData.length > 0 ? Math.round((passCount / dayData.length) * 100) : 0
        
        return {
          date,
          samples: dayData.length,
          passRate,
          averageValue: dayData.length > 0 
            ? Math.round((dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length) * 100) / 100 
            : 0
        }
      })

      return {
        ...location,
        stats,
        recentSamples,
        dailyTrends
      }
    })
  }, [])

  const selectedLocationData = locationData.find(loc => loc.id === selectedLocation)

  const getStatusColor = (passRate: number) => {
    if (passRate >= 90) return 'text-green-400'
    if (passRate >= 80) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'PASS': 'bg-green-600',
      'WARNING': 'bg-yellow-600',
      'FAIL': 'bg-red-600'
    }
    return variants[status as keyof typeof variants] || 'bg-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Processing Locations</h1>
        <p className="text-slate-400">Detailed view of each processing location and their quality metrics</p>
      </div>

      {/* Location Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationData.map((location) => (
          <Card 
            key={location.id}
            className={`bg-slate-800 border-slate-700 cursor-pointer transition-all hover:bg-slate-700/50 ${
              selectedLocation === location.id ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => setSelectedLocation(location.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm leading-tight">
                  {location.name}
                </CardTitle>
                <Badge
                  className={`${
                    location.stats.passRate >= 90 ? 'bg-green-600' :
                    location.stats.passRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                  } text-white text-xs`}
                >
                  {location.stats.passRate}%
                </Badge>
              </div>
              <CardDescription className="text-slate-400 text-xs">
                {location.product}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Quality Performance</span>
                    <span>{location.stats.passRate}%</span>
                  </div>
                  <Progress value={location.stats.passRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400">Total Samples</div>
                    <div className="text-white font-medium">{location.stats.total}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Avg Value</div>
                    <div className="text-white font-medium">
                      {location.stats.averageValue}{location.targetQuality.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Target</div>
                    <div className="text-white font-medium">
                      ≥{location.targetQuality.minValue}{location.targetQuality.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Status</div>
                    <div className={`font-medium ${getStatusColor(location.stats.passRate)}`}>
                      {location.stats.passRate >= 90 ? 'Excellent' :
                       location.stats.passRate >= 80 ? 'Good' :
                       location.stats.passRate >= 60 ? 'Warning' : 'Critical'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedLocationData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{selectedLocationData.name}</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed analysis and recent activity for {selectedLocationData.product}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-orange-600">
                  Trends
                </TabsTrigger>
                <TabsTrigger value="samples" className="data-[state=active]:bg-orange-600">
                  Recent Samples
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Total Samples</div>
                    <div className="text-2xl font-bold text-white">{selectedLocationData.stats.total}</div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Pass Rate</div>
                    <div className={`text-2xl font-bold ${getStatusColor(selectedLocationData.stats.passRate)}`}>
                      {selectedLocationData.stats.passRate}%
                    </div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Average Value</div>
                    <div className="text-2xl font-bold text-white">
                      {selectedLocationData.stats.averageValue}{selectedLocationData.targetQuality.unit}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Target</div>
                    <div className="text-2xl font-bold text-white">
                      ≥{selectedLocationData.targetQuality.minValue}{selectedLocationData.targetQuality.unit}
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                    <div className="text-green-400 text-sm">Passed Samples</div>
                    <div className="text-2xl font-bold text-green-400">{selectedLocationData.stats.passed}</div>
                    <div className="text-green-300 text-xs">
                      {selectedLocationData.stats.total > 0 
                        ? Math.round((selectedLocationData.stats.passed / selectedLocationData.stats.total) * 100)
                        : 0}% of total
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                    <div className="text-yellow-400 text-sm">Warning Samples</div>
                    <div className="text-2xl font-bold text-yellow-400">{selectedLocationData.stats.warnings}</div>
                    <div className="text-yellow-300 text-xs">
                      {selectedLocationData.stats.total > 0 
                        ? Math.round((selectedLocationData.stats.warnings / selectedLocationData.stats.total) * 100)
                        : 0}% of total
                    </div>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <div className="text-red-400 text-sm">Failed Samples</div>
                    <div className="text-2xl font-bold text-red-400">{selectedLocationData.stats.failed}</div>
                    <div className="text-red-300 text-xs">
                      {selectedLocationData.stats.total > 0 
                        ? Math.round((selectedLocationData.stats.failed / selectedLocationData.stats.total) * 100)
                        : 0}% of total
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">7-Day Trend Analysis</h3>
                  <div className="space-y-3">
                    {selectedLocationData.dailyTrends.map((trend, index) => (
                      <div key={trend.date} className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg">
                        <div className="w-20 text-sm text-slate-400">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-300">Pass Rate</span>
                            <span className={`text-sm font-medium ${getStatusColor(trend.passRate)}`}>
                              {trend.passRate}%
                            </span>
                          </div>
                          <Progress value={trend.passRate} className="h-2" />
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">{trend.samples}</div>
                          <div className="text-xs text-slate-400">samples</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">
                            {trend.averageValue}{selectedLocationData.targetQuality.unit}
                          </div>
                          <div className="text-xs text-slate-400">avg value</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="samples" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Recent Samples</h3>
                  <div className="space-y-2">
                    {selectedLocationData.recentSamples.map((sample) => (
                      <div key={sample.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${getStatusBadge(sample.status)} text-white text-xs`}>
                            {sample.status}
                          </Badge>
                          <div>
                            <div className="text-white font-medium text-sm">{sample.sampleId}</div>
                            <div className="text-slate-400 text-xs">{sample.analyst}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {sample.value}{sample.unit}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {new Date(sample.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
