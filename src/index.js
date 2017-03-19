import traverse from 'traverse'
import { del } from 'object-path'

/**
 * Test a field name match against a given key.
 *
 * @param {String|RegExp|Function} key The key to look for.
 * @param {String} name The name to compare the key against.
 * @return {Boolean} key/name matches.
 */
export const fieldMatch = (key, name, context = {}) => {
  if (typeof key === 'string') return key === name
  if (key instanceof RegExp) return !!name.match(key)
  if (key instanceof Function) return key(name, context)
  return false
}

/**
 * Find matching paths on a given data object and add new paths
 * to search queue when references are found.
 *
 * @param {Object} data The data object (i.g. apollo cache store).
 * @param {Array[String]]} path Key path array.
 * @param {Function} addPath Method to add paths to queue (used on references).
 * @return {Function} reducer.
 */
export const findMatchingPaths = (data, path, addPath) => {
  function findMatches (matches) {
    if (this.isRoot) return matches
    if (!fieldMatch(path[this.level - 1], this.key, this)) return (this.block(), matches)

    const isRef = this.keys && this.keys.every(key => ['type', 'id', 'generated'].includes(key))
    if (isRef) addPath([this.node.id].concat(path.slice(this.path.length)))

    // Matched and last.
    if (path.length === this.path.length) matches.push(this.path)

    return matches
  }

  return traverse(data).reduce(findMatches, [])
}

/**
 * Given an array of paths, find matching field paths.
 *
 * @param {Object} data The data object (i.g. apollo cache store).
 * @param {Array[Array[String]]} paths Array of paths of keys.
 * @return {Array} matching field paths.
 */
export const matchFinder = (data, paths) => {
  let i = 0
  let result = []

  const addPath = path => paths.push(path)

  while (paths[i]) {
    result = result.concat(findMatchingPaths(data, paths[i], addPath))
    i++
  }

  return result
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
  matchFinder(proxy.data, generator(proxy, result) || [])
    .forEach(path => del(proxy.data, path))
