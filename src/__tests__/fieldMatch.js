import { fieldMatch } from '../index'

describe('[method] fieldMatch', () => {
  it('should match against string keys', () => {
    expect(fieldMatch('id', 'id')).toBe(true)
    expect(fieldMatch('id', 'wrong-id')).toBe(false)
  })

  it('should match against regex keys', () => {
    // Simple forced match.
    expect(fieldMatch(/^id$/, 'id')).toBe(true)
    expect(fieldMatch(/^id$/, 'wrong-id')).toBe(false)

    // Loose matching.
    expect(fieldMatch(/id/, 'loose-id')).toBe(true)
    expect(fieldMatch(/id/, 'id-loose')).toBe(true)
  })

  it('should match against function keys', () => {
    const key = value => ['id1', 'id2'].includes(value)

    expect(fieldMatch(key, 'id1')).toBe(true)
    expect(fieldMatch(key, 'id2')).toBe(true)
    expect(fieldMatch(key, 'wrong-id')).toBe(false)
  })
})
