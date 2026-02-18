'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CENTER } from '@/lib/utils/constants'

interface GeolocationState {
  lat: number
  lng: number
  error: string | null
  loading: boolean
  permissionDenied: boolean
}

const supportsGeolocation = typeof window !== 'undefined' && 'geolocation' in navigator

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => ({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    error: supportsGeolocation ? null : 'Geolocation is not supported',
    loading: supportsGeolocation,
    permissionDenied: false,
  }))

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      error: null,
      loading: false,
      permissionDenied: false,
    })
  }, [])

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: error.message,
      loading: false,
      permissionDenied: error.code === error.PERMISSION_DENIED,
    }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    })
  }, [onSuccess, onError])

  return state
}
