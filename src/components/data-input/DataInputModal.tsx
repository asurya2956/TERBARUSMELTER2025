"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { PROCESSING_LOCATIONS } from '@/lib/data'
import { Plus, Upload, Scan } from 'lucide-react'

interface DataInputModalProps {
  onDataAdded: (newData: any) => void
}

export default function DataInputModal({ onDataAdded }: DataInputModalProps) {
  const [open, setOpen] = useState(false)
  const [inputMode, setInputMode] = useState<'manual' | 'barcode' | 'upload'>('manual')
  const [formData, setFormData] = useState({
    locationId: '',
    product: '',
    parameter: '',
    value: '',
    unit: '',
    targetMin: '',
    date: new Date(),
    sampleId: '',
    analyst: '',
    notes: ''
  })

  const selectedLocation = PROCESSING_LOCATIONS.find(loc => loc.id === formData.locationId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLocation) return
    
    const newData = {
      id: `manual_${Date.now()}`,
      locationId: formData.locationId,
      location: selectedLocation.name,
      product: selectedLocation.product,
      parameter: selectedLocation.targetQuality.parameter,
      value: parseFloat(formData.value),
      unit: selectedLocation.targetQuality.unit,
      targetMin: selectedLocation.targetQuality.minValue,
      date: format(formData.date, 'yyyy-MM-dd'),
      timestamp: formData.date.toISOString(),
      status: parseFloat(formData.value) >= selectedLocation.targetQuality.minValue ? 'PASS' : 'FAIL',
      sampleId: formData.sampleId || `SAMPLE-${Date.now()}`,
      analyst: formData.analyst || 'Lab Analyst',
      notes: formData.notes
    }
    
    onDataAdded(newData)
    setOpen(false)
    setFormData({
      locationId: '',
      product: '',
      parameter: '',
      value: '',
      unit: '',
      targetMin: '',
      date: new Date(),
      sampleId: '',
      analyst: '',
      notes: ''
    })
  }

  const handleLocationChange = (locationId: string) => {
    const location = PROCESSING_LOCATIONS.find(loc => loc.id === locationId)
    if (location) {
      setFormData({
        ...formData,
        locationId,
        product: location.product,
        parameter: location.targetQuality.parameter,
        unit: location.targetQuality.unit,
        targetMin: location.targetQuality.minValue.toString()
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Sample
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Lab Analysis Result</DialogTitle>
          <DialogDescription className="text-slate-400">
            Input new quality data from laboratory analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Mode Selection */}
          <div className="flex space-x-2">
            <Button
              variant={inputMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setInputMode('manual')}
              className={inputMode === 'manual' ? 'bg-orange-600' : ''}
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={inputMode === 'barcode' ? 'default' : 'outline'}
              onClick={() => setInputMode('barcode')}
              className={inputMode === 'barcode' ? 'bg-orange-600' : ''}
            >
              <Scan className="w-4 h-4 mr-2" />
              Barcode Scan
            </Button>
            <Button
              variant={inputMode === 'upload' ? 'default' : 'outline'}
              onClick={() => setInputMode('upload')}
              className={inputMode === 'upload' ? 'bg-orange-600' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {inputMode === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Processing Location</Label>
                  <Select value={formData.locationId} onValueChange={handleLocationChange} required>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {PROCESSING_LOCATIONS.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Analysis Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-slate-700 border-slate-600 text-white"
                      >
                        {format(formData.date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({...formData, date})}
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {selectedLocation && (
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Location Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Product:</span>
                      <span className="text-white ml-2">{selectedLocation.product}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Parameter:</span>
                      <span className="text-white ml-2">{selectedLocation.targetQuality.parameter}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Unit:</span>
                      <span className="text-white ml-2">{selectedLocation.targetQuality.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Target:</span>
                      <span className="text-white ml-2">≥{selectedLocation.targetQuality.minValue}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Sample ID</Label>
                  <Input
                    value={formData.sampleId}
                    onChange={(e) => setFormData({...formData, sampleId: e.target.value})}
                    placeholder="e.g., DISCHARGE-001"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Analyst Name</Label>
                  <Input
                    value={formData.analyst}
                    onChange={(e) => setFormData({...formData, analyst: e.target.value})}
                    placeholder="Lab analyst name"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Measured Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder={`Enter ${selectedLocation?.targetQuality.parameter} value`}
                  className="bg-slate-700 border-slate-600"
                  required
                />
              </div>

              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes or observations..."
                  className="bg-slate-700 border-slate-600"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Add Sample
                </Button>
              </div>
            </form>
          )}

          {inputMode === 'barcode' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-medium text-white mb-2">Barcode Scanner</h3>
              <p className="text-slate-400 mb-4">
                Point your camera at the sample barcode to automatically populate the data
              </p>
              <div className="bg-slate-700/50 rounded-lg p-8">
                <div className="w-64 h-64 mx-auto bg-slate-600 rounded-lg flex items-center justify-center">
                  <div className="text-slate-400">Camera Preview</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                Barcode scanning feature coming soon...
              </p>
            </div>
          )}

          {inputMode === 'upload' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-medium text-white mb-2">Upload Lab Report</h3>
              <p className="text-slate-400 mb-4">
                Upload PDF, CSV, or Excel files containing lab analysis results
              </p>
              <div className="bg-slate-700/50 rounded-lg p-8">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-400">Drag & drop files here or click to browse</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Supports: PDF, CSV, XLSX
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                Document upload feature coming soon...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
