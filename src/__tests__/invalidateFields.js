import { invalidateFields } from '../index'

const getProxyObject = () => ({
  data: {
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
})

describe('[method] invalidateFields', () => {
  it('should invalidate root level paths', () => {
    const proxy = getProxyObject()
    const invalidator = invalidateFields(() => [['id1']])

    expect(proxy).toHaveProperty('data.id1')
    invalidator(proxy, {})
    expect(proxy).not.toHaveProperty('data.id1')
  })

  it('should invalidate second level paths', () => {
    const proxy = getProxyObject()
    const invalidator = invalidateFields(() => [['id1', 'f1']])

    expect(proxy).toHaveProperty('data.id1.f1')
    invalidator(proxy, {})
    expect(proxy).toHaveProperty('data.id1')
    expect(proxy).not.toHaveProperty('data.id1.f1')
  })

  it('should invalidate third level (via reference) paths', () => {
    const proxy = getProxyObject()
    const invalidator = invalidateFields(() => [['ROOT_QUERY', 'refField2', 'f1']])

    expect(proxy).toHaveProperty('data.id2.f1')
    invalidator(proxy, {})
    expect(proxy).toHaveProperty('data.ROOT_QUERY.refField2')
    expect(proxy).toHaveProperty('data.id2')
    expect(proxy).not.toHaveProperty('data.id2.f1')
  })

  it('should invalidate fourth level (via double reference) paths', () => {
    const proxy = getProxyObject()
    const invalidator = invalidateFields(() => [['ROOT_QUERY', 'refField3', 'refField4', 'f1']])

    expect(proxy).toHaveProperty('data.id4.f1')
    invalidator(proxy, {})
    expect(proxy).toHaveProperty('data.ROOT_QUERY.refField3')
    expect(proxy).toHaveProperty('data.id3.refField4')
    expect(proxy).toHaveProperty('data.id4')
    expect(proxy).not.toHaveProperty('data.id4.f1')
  })

  it('should invalidate paths paths', () => {
    const proxy = getProxyObject()
    const invalidator = invalidateFields(() => [['ROOT_QUERY'], ['id1', 'f1']])

    expect(proxy).toHaveProperty('data.ROOT_QUERY')
    expect(proxy).toHaveProperty('data.id1.f1')
    invalidator(proxy, {})
    expect(proxy).toHaveProperty('data.ROOT_QUERY', {})
    expect(proxy).not.toHaveProperty('data.id1.f1')
  })
})
