"use client"

import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/components/auth/LoginPage'
import Dashboard from '@/components/dashboard/Dashboard'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/dashboard/*" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
      />
    </Routes>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  )
}
