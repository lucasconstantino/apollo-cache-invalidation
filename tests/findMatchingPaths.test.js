import { findMatchingPaths } from 'apollo-cache-invalidation'

describe('[method] findMatchingPaths', () => {
  const cached = {
    'ROOT_QUERY': {
      'refField1': { type: 'id', id: 'id1', generated: false },
      'refField2': { type: 'id', id: 'id2', generated: false },
      'multiRefField1': [
        { type: 'id', id: 'id1', generated: false },
        { type: 'id', id: 'id2', generated: false },
      ]
    },
    'id1': { 'f1': 'id1 field one value', 'f2': 'id1 field two value' },
    'id2': { 'f1': 'id2 field one value', 'f2': 'id2 field two value' },
    'id3': { 'f1': 'id3 field one value', 'f2': 'id3 field two value' },
  }

  const addPath = jest.fn()
  const matcher = path => findMatchingPaths(cached, path, addPath)

  beforeEach(() => addPath.mockReset())

  it('should match root level keys', () => {
    expect(matcher(['id1'])).toContainEqual(['id1'])
    expect(matcher(['ROOT_QUERY'])).toContainEqual(['ROOT_QUERY'])
    expect(matcher(['wrong-id']).length).toBe(0)
  })

  it('should match second level keys', () => {
    expect(matcher(['ROOT_QUERY', 'refField1'])).toContainEqual(['ROOT_QUERY', 'refField1'])
    expect(matcher(['ROOT_QUERY', 'wrong-field']).length).toBe(0)
  })

  it('should add paths on third level keys', () => {
    matcher(['ROOT_QUERY', 'refField2', 'f1'])
    expect(addPath).toHaveBeenCalledWith(['id2', 'f1'])
  })

  it('should add paths on third level array of keys', () => {
    matcher(['ROOT_QUERY', 'multiRefField1', 'f1'])
    expect(addPath).toHaveBeenCalledWith(['id1', 'f1'])
    expect(addPath).toHaveBeenCalledWith(['id2', 'f1'])
  })
})
