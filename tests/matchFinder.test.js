import { matchFinder } from 'apollo-cache-invalidation'

describe('[method] matchFinder', () => {
  const cached = {
    'ROOT_QUERY': {
      'refField1': { type: 'id', id: 'id1', generated: false },
      'refField2': { type: 'id', id: 'id2', generated: false },
      'refField3': { type: 'id', id: 'id3', generated: false }
    },
    'id1': { 'f1': 'id1 field one value', 'f2': 'id1 field two value' },
    'id2': { 'f1': 'id2 field one value', 'f2': 'id2 field two value' },
    'id3': { 'refField4': { type: 'id', id: 'id4', generated: false } },
    'id4': { 'f1': 'id3 field one value', 'f2': 'id3 field two value' },
  }

  it('should match root level keys', () => {
    expect(matchFinder(cached, [['id1']])).toContainEqual(['id1'])
    expect(matchFinder(cached, [['ROOT_QUERY']])).toContainEqual(['ROOT_QUERY'])
    expect(matchFinder(cached, [['wrong-id']]).length).toBe(0)
  })

  it('should match second level keys', () => {
    expect(matchFinder(cached, [['ROOT_QUERY', 'refField1']])).toContainEqual(['ROOT_QUERY', 'refField1'])
    expect(matchFinder(cached, [['ROOT_QUERY', 'wrong-field']]).length).toBe(0)
  })

  it('should match third level keys', () => {
    expect(matchFinder(cached, [['ROOT_QUERY', 'refField2', 'f1']])).toContainEqual(['id2', 'f1'])
  })

  it('should match fourth level keys', () => {
    expect(matchFinder(cached, [['ROOT_QUERY', 'refField3', 'refField4', 'f1']])).toContainEqual(['id4', 'f1'])
  })

  it('should match multiple paths', () => {
    const result = matchFinder(cached, [['ROOT_QUERY'], ['id1', 'f1'], ['wrong-id']])
    expect(result).toContainEqual(['ROOT_QUERY'])
    expect(result).toContainEqual(['id1', 'f1'])
    expect(result.length).toBe(2)
  })
})
