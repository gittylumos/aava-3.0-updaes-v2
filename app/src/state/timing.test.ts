import { describe, it, expect } from 'vitest'
import { streamMs, T } from './timing'

describe('streamMs', () => {
  it('converts text length to milliseconds at the streaming rate', () => {
    const text = 'a'.repeat(T.streamCps) // exactly one second of characters
    expect(streamMs(text)).toBe(1000)
  })

  it('returns 0 for empty text', () => {
    expect(streamMs('')).toBe(0)
  })
})
