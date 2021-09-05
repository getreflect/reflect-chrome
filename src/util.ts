// util.ts provides utility functions that can be reused in other modules

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

export function cleanDomain(urls: (string | undefined)[], exact = false): string {
  // check to see if urls exist
  if (urls[0] === undefined) {
    // return empty if not
    return ''
  } else {
    // regex match for url
    const activeURL: RegExpMatchArray | null = urls[0].match(exact ? /^[\w]+:\/{2}(.*)/ : /^[\w]+:\/{2}([\w\.:-]+)/)

    // no matching sites, return empty
    if (activeURL == null) {
      return ''
    } else {
      // strip www.
      return activeURL[1].replace('www.', '')
    }
  }
}

export function insertAfter(newNode: HTMLElement, existingNode: HTMLElement) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling)
}

export function createDivFromHTML(htmlString: string): HTMLElement {
  const newDiv = document.createElement('div')
  newDiv.insertAdjacentHTML('beforeend', htmlString)
  return newDiv
}

export function getElementFromForm(id: string): HTMLFormElement {
  return document.getElementById(id) as HTMLFormElement
}
