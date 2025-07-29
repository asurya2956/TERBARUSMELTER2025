"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PROCESSING_LOCATIONS, SAMPLE_DATA, getAlerts } from '@/lib/data'

export default function DashboardAlerts() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<any>(null)

  const alerts = useMemo(() => {
    let filtered = getAlerts()

    // Filter by severity
    if (selectedSeverity !== 'all') {
      if (selectedSeverity === 'critical') {
        filtered = filtered.filter(alert => alert.status === 'FAIL')
      } else if (selectedSeverity === 'warning') {
        filtered = filtered.filter(alert => alert.status === 'WARNING')
      }
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(alert => alert.locationId === selectedLocation)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sampleId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [selectedSeverity, selectedLocation, searchTerm])

  const alertStats = useMemo(() => {
    const allAlerts = getAlerts()
    const critical = allAlerts.filter(a => a.status === 'FAIL').length
    const warnings = allAlerts.filter(a => a.status === 'WARNING').length
    const total = allAlerts.length

    // Group by location
    const locationAlerts = PROCESSING_LOCATIONS.map(location => {
      const locationAlerts = allAlerts.filter(a => a.locationId === location.id)
      const locationCritical = locationAlerts.filter(a => a.status === 'FAIL').length
      const locationWarnings = locationAlerts.filter(a => a.status === 'WARNING').length
      
      return {
        ...location,
        total: locationAlerts.length,
        critical: locationCritical,
        warnings: locationWarnings
      }
    }).filter(loc => loc.total > 0)

    // Recent trends (last 24 hours vs previous 24 hours)
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const recentAlerts = allAlerts.filter(a => new Date(a.timestamp) >= last24h)
    const previousAlerts = allAlerts.filter(a => 
      new Date(a.timestamp) >= previous24h && new Date(a.timestamp) < last24h
    )

    const trend = recentAlerts.length - previousAlerts.length

    return {
      total,
      critical,
      warnings,
      locationAlerts,
      recentCount: recentAlerts.length,
      trend
    }
  }, [])

  const getSeverityColor = (status: string) => {
    return status === 'FAIL' ? 'bg-red-600' : 'bg-yellow-600'
  }

  const getSeverityIcon = (status: string) => {
    return status === 'FAIL' ? '🚨' : '⚠️'
  }

  const getPriorityLevel = (alert: any) => {
    const deviation = ((alert.targetMin - alert.value) / alert.targetMin) * 100
    if (alert.status === 'FAIL') {
      if (deviation > 20) return 'High'
      if (deviation > 10) return 'Medium'
      return 'Low'
    }
    return 'Low'
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quality Alerts</h1>
          <p className="text-slate-400">Monitor and manage quality issues requiring attention</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-orange-600 hover:bg-orange-700">
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{alertStats.total}</div>
            <p className="text-xs text-slate-400">Active quality issues</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{alertStats.critical}</div>
            <p className="text-xs text-slate-400">Failed quality tests</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Warning Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{alertStats.warnings}</div>
            <p className="text-xs text-slate-400">Below target threshold</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">24h Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alertStats.trend > 0 ? 'text-red-400' : alertStats.trend < 0 ? 'text-green-400' : 'text-slate-400'}`}>
              {alertStats.trend > 0 ? '+' : ''}{alertStats.trend}
            </div>
            <p className="text-xs text-slate-400">vs previous 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription className="text-slate-400">
            Filter alerts by severity, location, and search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="warning">Warning Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <label className="text-sm font-medium text-slate-300 mb-2 block">Search</label>
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="active" className="data-[state=active]:bg-orange-600">
            Active Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-orange-600">
            By Location
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-white mb-2">No Active Alerts</h3>
                  <p className="text-slate-400">All quality parameters are within acceptable ranges</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getSeverityIcon(alert.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`${getSeverityColor(alert.status)} text-white text-xs`}>
                              {alert.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getPriorityLevel(alert)} Priority
                            </Badge>
                            <span className="text-slate-400 text-xs">
                              {getTimeAgo(alert.timestamp)}
                            </span>
                          </div>
                          <h3 className="text-white font-medium">
                            {alert.location} - {alert.product}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            Sample {alert.sampleId}: {alert.parameter} level at {alert.value}{alert.unit} 
                            (Target: ≥{alert.targetMin}{alert.unit})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-lg">
                          {alert.value}{alert.unit}
                        </div>
                        <div className="text-slate-400 text-sm">
                          Target: ≥{alert.targetMin}{alert.unit}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 bg-slate-700 border-slate-600 hover:bg-slate-600"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800 border-slate-700 text-white">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <span>{getSeverityIcon(alert.status)}</span>
                                <span>Alert Details</span>
                              </DialogTitle>
                              <DialogDescription className="text-slate-400">
                                Quality alert for {alert.location}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-slate-400">Sample ID</label>
                                  <div className="text-white font-mono">{alert.sampleId}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Status</label>
                                  <div>
                                    <Badge className={`${getSeverityColor(alert.status)} text-white`}>
                                      {alert.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Location</label>
                                  <div className="text-white">{alert.location}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Product</label>
                                  <div className="text-white">{alert.product}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Parameter</label>
                                  <div className="text-white">{alert.parameter}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Analyst</label>
                                  <div className="text-white">{alert.analyst}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Measured Value</label>
                                  <div className="text-white font-medium text-lg">
                                    {alert.value}{alert.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Target Minimum</label>
                                  <div className="text-white font-medium text-lg">
                                    {alert.targetMin}{alert.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Deviation</label>
                                  <div className="text-red-400 font-medium">
                                    -{Math.round(((alert.targetMin - alert.value) / alert.targetMin) * 100)}%
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Priority</label>
                                  <div className="text-white">{getPriorityLevel(alert)}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-400">Date</label>
                                  <div className="text-white">
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm text-slate-400 block mb-2">Actions Taken</label>
                                <Textarea 
                                  placeholder="Record any actions taken to address this alert..."
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button className="bg-orange-600 hover:bg-orange-700">
                                  Acknowledge
                                </Button>
                                <Button variant="outline" className="border-slate-600">
                                  Escalate
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alertStats.locationAlerts.map((location) => (
              <Card key={location.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm leading-tight">
                    {location.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {location.product}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Alerts</span>
                      <span className="text-white font-medium">{location.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Critical</span>
                      <Badge className="bg-red-600 text-white text-xs">
                        {location.critical}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Warnings</span>
                      <Badge className="bg-yellow-600 text-white text-xs">
                        {location.warnings}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <div className="text-xs text-slate-400">
                        Target: ≥{location.targetQuality.minValue}{location.targetQuality.unit}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
