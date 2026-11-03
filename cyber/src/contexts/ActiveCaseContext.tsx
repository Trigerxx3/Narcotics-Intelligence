'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

type ActiveCase = any | null

interface ActiveCaseContextType {
  activeCase: ActiveCase
  setActiveCase: (caseId: number) => Promise<void>
  clearActiveCase: () => Promise<void>
  refreshActiveCase: () => Promise<void>
  loading: boolean
}

const ActiveCaseContext = createContext<ActiveCaseContextType | undefined>(undefined)

export function ActiveCaseProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [activeCase, setActiveCaseState] = useState<ActiveCase>(null)
  const [loading, setLoading] = useState(true)

  const refreshActiveCase = async () => {
    try {
      // Check if user is authenticated before making the request
      if (!user) {
        setActiveCaseState(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('active_case')
        }
        return
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        setActiveCaseState(null)
        return
      }

      const res = await apiClient.getActiveCase()
      const data = (res as any)?.data
      setActiveCaseState(data || null)
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_case', data ? JSON.stringify(data) : '')
      }
    } catch (e: any) {
      // Handle authentication errors properly
      if (e?.status === 401 || String(e?.message).includes('401')) {
        console.log('🔐 ActiveCase: Authentication error (401), clearing active case')
        setActiveCaseState(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('active_case')
        }
      } else {
        console.warn('🔐 ActiveCase: Could not fetch active case:', e?.message || e)
      }
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setActiveCaseState(null)
      setLoading(false)
      return
    }

    (async () => {
      // bootstrap from localStorage quickly
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('active_case')
        if (raw) {
          try { setActiveCaseState(JSON.parse(raw)) } catch {}
        }
      }
      await refreshActiveCase()
      setLoading(false)
    })()
  }, [user, authLoading])

  const setActiveCase = async (caseId: number) => {
    await apiClient.setActiveCase(caseId)
    await refreshActiveCase()
  }

  const clearActiveCase = async () => {
    await apiClient.clearActiveCase()
    setActiveCaseState(null)
    if (typeof window !== 'undefined') localStorage.removeItem('active_case')
  }

  return (
    <ActiveCaseContext.Provider value={{ activeCase, setActiveCase, clearActiveCase, refreshActiveCase, loading }}>
      {children}
    </ActiveCaseContext.Provider>
  )
}

export function useActiveCase() {
  const ctx = useContext(ActiveCaseContext)
  if (!ctx) throw new Error('useActiveCase must be used within ActiveCaseProvider')
  return ctx
}
