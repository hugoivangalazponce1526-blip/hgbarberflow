import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: '#1A1A1A',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* Pole body */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          top: 3,
          width: 12,
          height: 26,
          borderRadius: 6,
          background: '#2A2A2A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ width: 12, height: 7, background: '#C9A84C', flexShrink: 0 }} />
        <div style={{ width: 12, height: 4, background: '#2A2A2A', flexShrink: 0 }} />
        <div style={{ width: 12, height: 7, background: '#C9A84C', flexShrink: 0 }} />
        <div style={{ width: 12, height: 4, background: '#2A2A2A', flexShrink: 0 }} />
        <div style={{ width: 12, height: 4, background: '#C9A84C', flexShrink: 0 }} />
      </div>
      {/* Top cap */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          top: 0,
          width: 12,
          height: 5,
          borderRadius: 100,
          background: '#C9A84C',
        }}
      />
      {/* Bottom cap */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 0,
          width: 12,
          height: 5,
          borderRadius: 100,
          background: '#C9A84C',
        }}
      />
    </div>,
    { width: 32, height: 32 }
  )
}
