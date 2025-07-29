"use client"

import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import DashboardOverview from './DashboardOverview'
import DashboardReports from './DashboardReports'
import DashboardLocations from './DashboardLocations'
import DashboardHistory from './DashboardHistory'
import DashboardAlerts from './DashboardAlerts'
import DataInputModal from '@/components/data-input/DataInputModal'
import { SAMPLE_DATA } from '@/lib/data'

const navigation = [
  { name: 'Overview', path: '/dashboard', icon: '📊' },
  { name: 'Reports', path: '/dashboard/reports', icon: '📈' },
  { name: 'Locations', path: '/dashboard/locations', icon: '📍' },
  { name: 'History', path: '/dashboard/history', icon: '📅' },
  { name: 'Alerts', path: '/dashboard/alerts', icon: '🚨' },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [data, setData] = useState(SAMPLE_DATA)

  const handleDataAdded = (newData: any) => {
    setData(prevData => [newData, ...prevData])
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SX</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-bold text-lg">SmelterXplore™️</h1>
                <p className="text-slate-400 text-xs">Quality Monitoring</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-slate-400 text-xs">Logged in as</p>
              <p className="text-white font-medium">{user?.username}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </Button>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 -right-3 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {navigation.find(nav => isActive(nav.path))?.name || 'Dashboard'}
              </h2>
              <p className="text-slate-400 text-sm">
                Real-time quality monitoring and analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <DataInputModal onDataAdded={handleDataAdded} />
              <div className="text-right">
                <p className="text-slate-400 text-xs">Last Updated</p>
                <p className="text-white text-sm font-medium">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/reports" element={<DashboardReports />} />
            <Route path="/locations" element={<DashboardLocations />} />
            <Route path="/history" element={<DashboardHistory />} />
            <Route path="/alerts" element={<DashboardAlerts />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
