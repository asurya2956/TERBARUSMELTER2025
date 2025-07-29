export interface ProcessingLocation {
  id: string
  name: string
  product: string
  targetQuality: {
    parameter: string
    minValue: number
    unit: string
  }
}

export interface QualityData {
  id: string
  locationId: string
  location: string
  product: string
  parameter: string
  value: number
  unit: string
  targetMin: number
  date: string
  timestamp: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  sampleId: string
  analyst: string
}

export const PROCESSING_LOCATIONS: ProcessingLocation[] = [
  {
    id: 'discharge_point',
    name: 'DISCHARGE POINT',
    product: 'Copper Concentrate',
    targetQuality: {
      parameter: 'Copper',
      minValue: 25,
      unit: '%'
    }
  },
  {
    id: 'flash_smelting_furnace',
    name: 'FLASH SMELTING FURNACE',
    product: 'Copper Matte',
    targetQuality: {
      parameter: 'Copper',
      minValue: 70,
      unit: '%'
    }
  },
  {
    id: 'slag_concentrator',
    name: 'SLAG CONCENTRATOR',
    product: 'Recovery Copper Concentrate',
    targetQuality: {
      parameter: 'Copper',
      minValue: 22,
      unit: '%'
    }
  },
  {
    id: 'acid_plant',
    name: 'ACID PLANT',
    product: 'Sulfuric Acid',
    targetQuality: {
      parameter: 'Sulfuric Acid',
      minValue: 98.5,
      unit: '%'
    }
  },
  {
    id: 'flash_converting_furnace',
    name: 'FLASH CONVERTING FURNACE',
    product: 'Copper Blister',
    targetQuality: {
      parameter: 'Copper',
      minValue: 98.5,
      unit: '%'
    }
  },
  {
    id: 'anode_furnace',
    name: 'ANODE FURNACE & ANODE CASTING WHEEL',
    product: 'Copper Anode',
    targetQuality: {
      parameter: 'Copper',
      minValue: 99.2,
      unit: '%'
    }
  },
  {
    id: 'copper_electro_refining',
    name: 'COPPER ELECTRO REFINING',
    product: 'Copper Cathode',
    targetQuality: {
      parameter: 'Copper',
      minValue: 99.99,
      unit: '%'
    }
  },
  {
    id: 'pmr_gold',
    name: 'PMR_Gold',
    product: 'Gold',
    targetQuality: {
      parameter: 'Gold',
      minValue: 99.99,
      unit: '%'
    }
  },
  {
    id: 'pmr_silver',
    name: 'PMR_Silver',
    product: 'Silver',
    targetQuality: {
      parameter: 'Silver',
      minValue: 99.99,
      unit: '%'
    }
  }
]

// Generate sample data
function generateSampleData(): QualityData[] {
  const data: QualityData[] = []
  const analysts = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis']
  
  PROCESSING_LOCATIONS.forEach(location => {
    // Generate 50 samples for each location
    for (let i = 0; i < 50; i++) {
      const baseDate = new Date()
      baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30)) // Last 30 days
      baseDate.setHours(Math.floor(Math.random() * 24))
      baseDate.setMinutes(Math.floor(Math.random() * 60))
      
      // Generate realistic values around the target
      const target = location.targetQuality.minValue
      let value: number
      
      // 80% chance of passing, 15% warning, 5% fail
      const rand = Math.random()
      if (rand < 0.8) {
        // Pass - above target
        value = target + (Math.random() * (target * 0.05)) // 0-5% above target
      } else if (rand < 0.95) {
        // Warning - slightly below target
        value = target - (Math.random() * (target * 0.02)) // 0-2% below target
      } else {
        // Fail - significantly below target
        value = target - (Math.random() * (target * 0.1)) // 0-10% below target
      }
      
      // Round to appropriate decimal places
      value = Math.round(value * 100) / 100
      
      let status: 'PASS' | 'FAIL' | 'WARNING'
      if (value >= target) {
        status = 'PASS'
      } else if (value >= target * 0.98) {
        status = 'WARNING'
      } else {
        status = 'FAIL'
      }
      
      data.push({
        id: `${location.id}_${i + 1}`,
        locationId: location.id,
        location: location.name,
        product: location.product,
        parameter: location.targetQuality.parameter,
        value,
        unit: location.targetQuality.unit,
        targetMin: target,
        date: baseDate.toISOString().split('T')[0],
        timestamp: baseDate.toISOString(),
        status,
        sampleId: `${location.id.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        analyst: analysts[Math.floor(Math.random() * analysts.length)]
      })
    }
  })
  
  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const SAMPLE_DATA = generateSampleData()

// Helper functions
export function getLocationData(locationId: string): QualityData[] {
  return SAMPLE_DATA.filter(data => data.locationId === locationId)
}

export function getRecentData(days: number = 7): QualityData[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  return SAMPLE_DATA.filter(data => new Date(data.timestamp) >= cutoffDate)
}

export function getAlerts(): QualityData[] {
  return SAMPLE_DATA.filter(data => data.status === 'FAIL' || data.status === 'WARNING')
    .slice(0, 20) // Latest 20 alerts
}

export function getLocationStats(locationId: string) {
  const locationData = getLocationData(locationId)
  const total = locationData.length
  const passed = locationData.filter(d => d.status === 'PASS').length
  const warnings = locationData.filter(d => d.status === 'WARNING').length
  const failed = locationData.filter(d => d.status === 'FAIL').length
  
  return {
    total,
    passed,
    warnings,
    failed,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    averageValue: total > 0 ? Math.round((locationData.reduce((sum, d) => sum + d.value, 0) / total) * 100) / 100 : 0
  }
}
