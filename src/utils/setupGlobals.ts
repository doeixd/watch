export function setupGlobals () {
  // @ts-ignore
  var states = window?.states ?? new WeakMap()
  // @ts-ignore
  window.states ??= states

  // @ts-ignore
  var cleanups = window?.cleanups ?? new WeakMap()
  // @ts-ignore
  window.cleanups ??= cleanups

  // @ts-ignore
  var setups = window?.setups ?? new WeakSet()
  // @ts-ignore
  window.setups ??= setups

  return { states, cleanups, setups }
}