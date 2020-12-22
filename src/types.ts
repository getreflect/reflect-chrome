export interface Intent {
  intent: string
  url: string
}

export interface Storage {
  // feature toggles
  isEnabled?: boolean
  enableBlobs?: boolean

  // lists
  blockedSites?: string[]
  intentList?: { [key: string]: Intent }
  whitelistedSites?: { [key: string]: string }

  // misc config
  numIntentEntries?: number
  whitelistTime?: number
}
