export const getRandomString = (length: number): string =>
  [...Array(length)]
    .map((_) => ((Math.random() * 36) | 0).toString(36)) // tslint:disable-line
    .join('')
