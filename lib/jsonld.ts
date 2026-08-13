// JSON.stringify escapes quotes but leaves "<" alone, so a bio or display name
// containing </script> would close the tag and run whatever came after it.
// Everything on a public page is typed by the page's owner, so this has to be
// escaped before it goes anywhere near dangerouslySetInnerHTML.
export function jsonLdScript(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
