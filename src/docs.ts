const OPENAPI_UI_SCRIPT = 'https://cdn.jsdelivr.net/npm/openapi-ui-dist@latest/lib/openapi-ui.umd.js'

export const openApiUiPage = (specUrl: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>openAPI UI</title>
  </head>
  <body>
    <div id="openapi-ui-container" spec-url="${specUrl}" theme="light"></div>
    <script src="${OPENAPI_UI_SCRIPT}"></script>
  </body>
</html>`
