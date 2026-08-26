globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
globalThis.location = { search: '' }
globalThis.performance = globalThis.performance ?? { now: () => 0 }
globalThis.window = globalThis
