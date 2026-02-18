'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface TicketQRCodeProps {
  confirmationCode: string
  ticketId: string
  size?: number
}

export function TicketQRCode({ confirmationCode, ticketId, size = 200 }: TicketQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      // Encode ticket ID and confirmation code for scanning
      const data = JSON.stringify({
        id: ticketId,
        code: confirmationCode,
      })

      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    }
  }, [confirmationCode, ticketId, size])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  )
}
