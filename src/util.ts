export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

export function cleanDomain(urls: (string | undefined)[]): string {
  // check to see if urls exist
  if (urls[0] === undefined) {
    // return empty if not
    return ''
  } else {
    // regex match for url
    const activeURL: RegExpMatchArray | null = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/)

    // no matching sites, return empty
    if (activeURL == null) {
      return ''
    } else {
      // strip www.
      return activeURL[1].replace('www.', '')
    }
  }
}
