const TYPES = new Set(['string', 'int', 'float', 'number', 'bool'])
const seen = new WeakSet()

function typeName(prop) {
  if (typeof prop !== 'string') return null
  const mark = prop.lastIndexOf('_')
  if (mark < 0) return null
  const name = prop.slice(mark + 1)
  return TYPES.has(name) ? name : null
}

function ok(type, value) {
  if (type === 'string') return typeof value === 'string'
  if (type === 'bool') return typeof value === 'boolean'
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (type === 'int') return Number.isInteger(value)
  if (type === 'float') return !Number.isInteger(value)
  return true
}

function check(prop, value) {
  const type = typeName(prop)
  if (!type || ok(type, value)) return
  throw new TypeError(`${prop} must be ${type}`)
}

function plain(value) {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function typeCheck(obj) {
  if (!plain(obj) || seen.has(obj)) return obj

  for (const key of Object.keys(obj)) {
    check(key, obj[key])
    if (plain(obj[key])) obj[key] = typeCheck(obj[key])
  }

  const proxy = new Proxy(obj, {
    set(target, prop, value) {
      check(prop, value)
      target[prop] = plain(value) ? typeCheck(value) : value
      return true
    },
  })

  seen.add(obj)
  seen.add(proxy)
  return proxy
}

export default typeCheck
