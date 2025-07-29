"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PROCESSING_LOCATIONS, SAMPLE_DATA } from '@/lib/data'
import { format } from 'date-fns'

export default function DashboardHistory() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [viewMode, setViewMode] = useState<'timeline' | 'summary'>('timeline')

  const historicalData = useMemo(() => {
    let filtered = SAMPLE_DATA

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(d => d.locationId === selectedLocation)
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(d => {
        const sampleDate = new Date(d.date)
        return sampleDate >= startDate && sampleDate <= endDate
      })
    } else {
      // Use selected period
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(selectedPeriod))
      filtered = filtered.filter(d => new Date(d.timestamp) >= cutoffDate)
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [selectedLocation, selectedPeriod, startDate, endDate])

  const timelineData = useMemo(() => {
    // Group data by date
    const grouped = historicalData.reduce((acc, sample) => {
      const date = sample.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(sample)
      return acc
    }, {} as Record<string, typeof historicalData>)

    // Convert to timeline format
    return Object.entries(grouped)
      .map(([date, samples]) => {
        const total = samples.length
        const passed = samples.filter(s => s.status === 'PASS').length
        const warnings = samples.filter(s => s.status === 'WARNING').length
        const failed = samples.filter(s => s.status === 'FAIL').length
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

        // Group by location for this date
        const locationBreakdown = PROCESSING_LOCATIONS.map(location => {
          const locationSamples = samples.filter(s => s.locationId === location.id)
          const locationPassed = locationSamples.filter(s => s.status === 'PASS').length
          const locationPassRate = locationSamples.length > 0 
            ? Math.round((locationPassed / locationSamples.length) * 100) 
            : 0

          return {
            ...location,
            samples: locationSamples.length,
            passed: locationPassed,
            passRate: locationPassRate,
            averageValue: locationSamples.length > 0
              ? Math.round((locationSamples.reduce((sum, s) => sum + s.value, 0) / locationSamples.length) * 100) / 100
              : 0
          }
        }).filter(loc => loc.samples > 0)

        return {
          date,
          total,
          passed,
          warnings,
          failed,
          passRate,
          samples,
          locationBreakdown
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [historicalData])

  const summaryData = useMemo(() => {
    // Monthly summary
    const monthlyData = historicalData.reduce((acc, sample) => {
      const month = sample.date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = []
      }
      acc[month].push(sample)
      return acc
    }, {} as Record<string, typeof historicalData>)

    return Object.entries(monthlyData)
      .map(([month, samples]) => {
        const total = samples.length
        const passed = samples.filter(s => s.status === 'PASS').length
        const warnings = samples.filter(s => s.status === 'WARNING').length
        const failed = samples.filter(s => s.status === 'FAIL').length
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

        // Calculate trends
        const sortedSamples = samples.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        const firstHalf = sortedSamples.slice(0, Math.floor(sortedSamples.length / 2))
        const secondHalf = sortedSamples.slice(Math.floor(sortedSamples.length / 2))
        
        const firstHalfPassRate = firstHalf.length > 0 
          ? Math.round((firstHalf.filter(s => s.status === 'PASS').length / firstHalf.length) * 100)
          : 0
        const secondHalfPassRate = secondHalf.length > 0 
          ? Math.round((secondHalf.filter(s => s.status === 'PASS').length / secondHalf.length) * 100)
          : 0
        
        const trend = secondHalfPassRate - firstHalfPassRate

        return {
          month,
          total,
          passed,
          warnings,
          failed,
          passRate,
          trend,
          averageValue: total > 0
            ? Math.round((samples.reduce((sum, s) => sum + s.value, 0) / total) * 100) / 100
            : 0
        }
      })
      .sort((a, b) => b.month.localeCompare(a.month))
  }, [historicalData])

  const getStatusColor = (passRate: number) => {
    if (passRate >= 90) return 'text-green-400'
    if (passRate >= 80) return 'text-yellow-400'
    return 'text-red-400'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Analysis</h1>
          <p className="text-slate-400">Track quality trends and performance over time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('timeline')}
            className={viewMode === 'timeline' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            Timeline
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            onClick={() => setViewMode('summary')}
            className={viewMode === 'summary' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            Summary
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription className="text-slate-400">
            Filter historical data by location and time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Locations</SelectItem>
                  {PROCESSING_LOCATIONS.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {startDate ? format(startDate, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {endDate ? format(endDate, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Daily Timeline</h2>
          {timelineData.map((day) => (
            <Card key={day.date} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <Badge className={`${
                    day.passRate >= 90 ? 'bg-green-600' :
                    day.passRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                  } text-white`}>
                    {day.passRate}% Pass Rate
                  </Badge>
                </div>
                <CardDescription className="text-slate-400">
                  {day.total} samples processed across {day.locationBreakdown.length} locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-400 text-sm">Total Samples</div>
                    <div className="text-xl font-bold text-white">{day.total}</div>
                  </div>
                  <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                    <div className="text-green-400 text-sm">Passed</div>
                    <div className="text-xl font-bold text-green-400">{day.passed}</div>
                  </div>
                  <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                    <div className="text-yellow-400 text-sm">Warnings</div>
                    <div className="text-xl font-bold text-yellow-400">{day.warnings}</div>
                  </div>
                  <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                    <div className="text-red-400 text-sm">Failed</div>
                    <div className="text-xl font-bold text-red-400">{day.failed}</div>
                  </div>
                </div>

                {/* Location Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Location Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {day.locationBreakdown.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                        <div>
                          <div className="text-white text-sm font-medium">
                            {location.name.length > 25 ? location.name.substring(0, 25) + '...' : location.name}
                          </div>
                          <div className="text-slate-400 text-xs">{location.samples} samples</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getStatusColor(location.passRate)}`}>
                            {location.passRate}%
                          </div>
                          <div className="text-slate-400 text-xs">
                            {location.averageValue}{location.targetQuality.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Monthly Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaryData.map((month) => (
              <Card key={month.month} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </CardTitle>
                    <Badge className={`${
                      month.passRate >= 90 ? 'bg-green-600' :
                      month.passRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                    } text-white`}>
                      {month.passRate}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-400">Total Samples</div>
                        <div className="text-white font-medium">{month.total}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Pass Rate</div>
                        <div className={`font-medium ${getStatusColor(month.passRate)}`}>
                          {month.passRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Avg Value</div>
                        <div className="text-white font-medium">{month.averageValue}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Trend</div>
                        <div className={`font-medium flex items-center space-x-1 ${getTrendColor(month.trend)}`}>
                          <span>{getTrendIcon(month.trend)}</span>
                          <span>{month.trend > 0 ? '+' : ''}{month.trend}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-green-400 font-medium">{month.passed}</div>
                          <div className="text-slate-400">Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-400 font-medium">{month.warnings}</div>
                          <div className="text-slate-400">Warnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-medium">{month.failed}</div>
                          <div className="text-slate-400">Failed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
