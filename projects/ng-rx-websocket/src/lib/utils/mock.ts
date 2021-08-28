export const mockModuleFunction = (importModule: any, methodName: string, returnValue: any = null) => {
  let currentVal = importModule[methodName]
  const descriptor = Object.getOwnPropertyDescriptor(importModule, methodName)
  if (!descriptor?.set) {
    Object.defineProperty(importModule, methodName, {
      set: (newVal) => {
        currentVal = newVal
      },
      get: () => {
        return currentVal
      },
      enumerable: true,
      configurable: true,
    })
  }
  return spyOn(importModule, methodName).and.returnValue(() => returnValue)
}
