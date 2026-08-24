const CUSTOM_CSS = `
:root {
  color-scheme: light;

  --scalar-font: 'Poppins', ui-sans-serif, system-ui, sans-serif;
  --scalar-font-code: ui-monospace, SFMono-Regular, Menlo, monospace;

  --scalar-radius: 0.25rem;
  --scalar-radius-lg: 0.5rem;
  --scalar-radius-xl: 0.75rem;
  --scalar-border-width: 1px;

  --scalar-color-1: oklch(21% 0.006 285.885);
  --scalar-color-2: oklch(44.2% 0.017 285.786);
  --scalar-color-3: oklch(55.2% 0.016 285.938);
  --scalar-color-accent: oklch(60.6% 0.25 292.717);

  --scalar-background-1: #fff;
  --scalar-background-2: oklch(98.5% 0 0);
  --scalar-background-3: oklch(96.7% 0.001 286.375);
  --scalar-background-accent: oklch(96.9% 0.016 293.756);

  --scalar-border-color: oklch(92% 0.004 286.32);

  --scalar-sidebar-background-1: oklch(98.5% 0 0);
  --scalar-sidebar-color-1: oklch(21% 0.006 285.885);
  --scalar-sidebar-color-2: oklch(55.2% 0.016 285.938);
  --scalar-sidebar-border-color: oklch(92% 0.004 286.32);
  --scalar-sidebar-item-hover-background: oklch(96.7% 0.001 286.375);
  --scalar-sidebar-item-hover-color: oklch(21% 0.006 285.885);
  --scalar-sidebar-item-active-background: oklch(96.7% 0.001 286.375);
  --scalar-sidebar-color-active: oklch(54.1% 0.281 293.009);
  --scalar-sidebar-search-background: #fff;
  --scalar-sidebar-search-color: oklch(55.2% 0.016 285.938);
  --scalar-sidebar-search-border-color: oklch(92% 0.004 286.32);
}

html,
body {
  height: 100%;
  margin: 0;
  overscroll-behavior: none;
  background: var(--scalar-background-1);
}

#app,
.scalar-app {
  overscroll-behavior: none;
}

.scalar-app a[href^='https://www.scalar.com'] {
  display: none;
}
`

const CONFIGURATION = {
  url: '/openapi.json',
  theme: 'none',
  darkMode: false,
  hideDarkModeToggle: true,
  hideClientButton: true,
  documentDownloadType: 'none',
  showDeveloperTools: 'never',
  withDefaultFonts: false,
  layout: 'modern',
  agent: { disabled: true },
  mcp: { disabled: true },
  customCss: CUSTOM_CSS,
}

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'x-frame-options', 'SAMEORIGIN')
  setResponseHeader(event, 'x-robots-tag', 'noindex')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>HayaseDB API reference</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
    />
  </head>
  <body>
    <div id="app"></div>
    <script src="/_docs/standalone.js"></script>
    <script>
      window.Scalar.createApiReference(
        '#app',
        ${JSON.stringify(CONFIGURATION)},
      )
    </script>
  </body>
</html>
`
})
