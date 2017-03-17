import traverse from 'traverse'
import objectPath from 'object-path'

/**
 * Test a field name match against a given key.
 *
 * @param {String|RegExp|Function} key The key to look for.
 * @param {String} name The name to compare the key against.
 * @return {Boolean} key/name matches.
 */
export const fieldMatch = (key, name) => {
  if (typeof key === 'string') return key === name
  if (key instanceof RegExp) return !!name.match(key)
  if (key instanceof Function) return key(name)
  return false
}

/**
 * Reducer generator to find matching paths on a given data object.
 *
 * @param {Object} data The data object (i.g. apollo cache store).
 * @return {Function} reducer.
 */
export const findMatchingPaths = data => (result, path) => {
  function findMatches (matches) {
    if (this.isRoot) return matches
    if (!fieldMatch(path[this.level - 1], this.key)) return (this.block(), matches)

    // Matched and last.
    if (path.length === this.path.length) matches.push(this.path)

    return matches
  }

  return traverse(data).reduce(findMatches, result)
}

/**
 * Apollo cache invalidator based on paths.
 *
 * @param {Function} generator A function which will be executed with the proxy
 *                             and the query result as as arguments and must return
 *                             an array of invalidating field paths.
 * @return {Function} update Update function such as expected by Apollo option.
 */
export const invalidateFields = generator => (proxy, result) =>
  (generator(proxy, result) || [])
    .reduce(findMatchingPaths(proxy.data), [])
    .forEach(path => objectPath.del(proxy.data, path))
