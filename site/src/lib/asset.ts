/** Prefix a public-folder path with the deploy base (e.g. GitHub Pages serves under /repo-name/). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
