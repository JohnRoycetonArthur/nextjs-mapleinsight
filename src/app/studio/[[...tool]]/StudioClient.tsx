'use client'

import { Studio } from 'sanity'
import config from '../../../../sanity.config'

export default function StudioClient() {
  return (
    <div style={{ height: '100vh', margin: 0 }}>
      <Studio config={config} />
    </div>
  )
}
