export const getCookieByName = (cookieName: string): string | null => {
  const pattern = RegExp(`${cookieName}=.[^;]*`)
  const matched = document.cookie.match(pattern)
  return matched ? matched[0].split('=')[1] : null
}
