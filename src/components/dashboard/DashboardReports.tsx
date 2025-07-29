"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PROCESSING_LOCATIONS, SAMPLE_DATA, QualityData } from '@/lib/data'

export default function DashboardReports() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = useMemo(() => {
    let filtered = SAMPLE_DATA

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(d => d.locationId === selectedLocation)
    }

    // Filter by product
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(d => d.product === selectedProduct)
    }

    // Filter by date range
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange))
    filtered = filtered.filter(d => new Date(d.timestamp) >= cutoffDate)

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.analyst.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [selectedLocation, selectedProduct, dateRange, searchTerm])

  const reportStats = useMemo(() => {
    const total = filteredData.length
    const passed = filteredData.filter(d => d.status === 'PASS').length
    const warnings = filteredData.filter(d => d.status === 'WARNING').length
    const failed = filteredData.filter(d => d.status === 'FAIL').length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

    // Group by location for location stats
    const locationStats = PROCESSING_LOCATIONS.map(location => {
      const locationData = filteredData.filter(d => d.locationId === location.id)
      const locationTotal = locationData.length
      const locationPassed = locationData.filter(d => d.status === 'PASS').length
      const locationPassRate = locationTotal > 0 ? Math.round((locationPassed / locationTotal) * 100) : 0
      
      return {
        ...location,
        total: locationTotal,
        passed: locationPassed,
        passRate: locationPassRate,
        averageValue: locationTotal > 0 
          ? Math.round((locationData.reduce((sum, d) => sum + d.value, 0) / locationTotal) * 100) / 100 
          : 0
      }
    }).filter(stat => stat.total > 0)

    return {
      total,
      passed,
      warnings,
      failed,
      passRate,
      locationStats
    }
  }, [filteredData])

  const uniqueProducts = [...new Set(SAMPLE_DATA.map(d => d.product))]

  const getStatusBadge = (status: string) => {
    const variants = {
      'PASS': 'bg-green-600',
      'WARNING': 'bg-yellow-600',
      'FAIL': 'bg-red-600'
    }
    return variants[status as keyof typeof variants] || 'bg-slate-600'
  }

  const exportData = () => {
    const csvContent = [
      ['Sample ID', 'Location', 'Product', 'Parameter', 'Value', 'Unit', 'Target Min', 'Status', 'Date', 'Analyst'].join(','),
      ...filteredData.map(d => [
        d.sampleId,
        d.location,
        d.product,
        d.parameter,
        d.value,
        d.unit,
        d.targetMin,
        d.status,
        d.date,
        d.analyst
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quality_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quality Reports</h1>
          <p className="text-slate-400">Detailed analysis and reporting of quality data</p>
        </div>
        <Button onClick={exportData} className="bg-orange-600 hover:bg-orange-700">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription className="text-slate-400">
            Filter data by location, product, date range, and search terms
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
              <label className="text-sm font-medium text-slate-300 mb-2 block">Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map(product => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Search</label>
              <Input
                placeholder="Search samples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Samples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{reportStats.total}</div>
            <p className="text-xs text-slate-400">Filtered results</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{reportStats.passRate}%</div>
            <p className="text-xs text-slate-400">{reportStats.passed} passed samples</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{reportStats.warnings}</div>
            <p className="text-xs text-slate-400">Samples below target</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{reportStats.failed}</div>
            <p className="text-xs text-slate-400">Critical quality issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance */}
      {reportStats.locationStats.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Location Performance</CardTitle>
            <CardDescription className="text-slate-400">
              Performance summary by processing location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportStats.locationStats.map(stat => (
                <div key={stat.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white text-sm">
                      {stat.name.length > 20 ? stat.name.substring(0, 20) + '...' : stat.name}
                    </h3>
                    <Badge className={`${stat.passRate >= 90 ? 'bg-green-600' : stat.passRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'} text-white`}>
                      {stat.passRate}%
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Samples:</span>
                      <span>{stat.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="text-green-400">{stat.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Value:</span>
                      <span>{stat.averageValue}{stat.targetQuality.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sample Data</CardTitle>
          <CardDescription className="text-slate-400">
            Detailed view of all quality samples ({filteredData.length} results)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Sample ID</TableHead>
                  <TableHead className="text-slate-300">Location</TableHead>
                  <TableHead className="text-slate-300">Product</TableHead>
                  <TableHead className="text-slate-300">Value</TableHead>
                  <TableHead className="text-slate-300">Target</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Analyst</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((sample) => (
                  <TableRow key={sample.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-slate-300 font-mono text-sm">
                      {sample.sampleId}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {sample.location.length > 25 ? sample.location.substring(0, 25) + '...' : sample.location}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {sample.product}
                    </TableCell>
                    <TableCell className="text-slate-300 font-medium">
                      {sample.value}{sample.unit}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      ≥{sample.targetMin}{sample.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadge(sample.status)} text-white text-xs`}>
                        {sample.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {new Date(sample.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {sample.analyst}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length > 50 && (
              <div className="mt-4 text-center text-slate-400 text-sm">
                Showing first 50 of {filteredData.length} results
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
