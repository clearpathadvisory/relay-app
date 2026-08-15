/**
 * CSV building and download, shared by the admin export and the Pro stats
 * export.
 *
 * Two things here are deliberate rather than incidental:
 *
 * 1. Every field is quoted and inner quotes are doubled. A display name like
 *    He said "hi", then left would otherwise split into three columns and
 *    silently corrupt every row after it.
 *
 * 2. A field beginning with = + - or @ gets a leading apostrophe. Spreadsheets
 *    treat those as the start of a formula, so a display name of
 *    =HYPERLINK(...) becomes executable content when the file is opened. This
 *    is CSV injection, and the export of user-supplied names is exactly where
 *    it bites.
 */

function cell(v: any): string {
  if (v === null || v === undefined) return '""'
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return '"' + s.replace(/"/g, '""') + '"'
}

export function toCsv(headers: string[], rows: any[][]): string {
  const lines = [headers.map(cell).join(',')]
  for (const r of rows) lines.push(r.map(cell).join(','))
  // A BOM so Excel opens UTF-8 names correctly instead of mangling them.
  return '\ufeff' + lines.join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function stamp() {
  return new Date().toISOString().slice(0, 10)
}
