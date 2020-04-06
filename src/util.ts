function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes*60000);
}

function cleanDomain(urls: (string | undefined)[]): string {
	
	// check to see if urls exist
	if (urls[0] == undefined) {
		// return empty if not
		return ""

	} else {
		// regex match for url
		const activeURL : RegExpMatchArray | null = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/)

		// no matching sites, return empty
		if (activeURL == null) {
			return ""
		} else {
			// strip www.
			return activeURL[1].replace("www.","")
		}
	}
}

function cleanStr(inputIntent: string): string {
	// strip punctuation
	const noPunc = inputIntent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")

	// strip capitalization
	const lower = noPunc.toLowerCase()

	// remove personal prefix
	const noPrefix = lower.replace("im ", "")
						  .replace("i ", "")

	// cleanup leftover spaces (2+ spaces to 1)
	return noPrefix.replace(/\s{2,}/g, " ");
}