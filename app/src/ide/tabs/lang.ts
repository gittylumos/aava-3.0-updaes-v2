/* Monaco language id for a scenario file name. */
const LANG: Record<string, string> = { html: 'html', ts: 'typescript', scss: 'scss', json: 'json' }

export function languageOf(file: string): string {
  return LANG[file.split('.').pop() ?? ''] ?? 'plaintext'
}

/* VS Code's breadcrumb trail: the repo folders, then the file. */
export function crumbsOf(fileRoot: string | undefined, file: string): string[] {
  return [...(fileRoot?.split('/').filter(Boolean) ?? []), file]
}
