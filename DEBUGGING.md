# Debugging Guide

## Debugging Astro Dev Server Endpoints

### Method 1: VS Code Debugger (Recommended)

1. **Open the playground workspace** in VS Code
2. **Set breakpoints** in the endpoint file:
   - Open `src/virtual/feedback-endpoint.js`
   - Click in the gutter next to line numbers to set breakpoints
   - Good places: inside POST handler, inside GET handler

3. **Start debugging**:
   - Press `F5` or go to Run > Start Debugging
   - Select "Debug Astro Dev Server" from the dropdown
   - Wait for the server to start (terminal will show "astro dev" output)

4. **Trigger the endpoint**:
   - Open browser to http://localhost:4321
   - Interact with the feedback widget
   - VS Code will pause at your breakpoints

5. **Inspect variables**:
   - Hover over variables to see values
   - Use the Debug Console to evaluate expressions
   - Check the Call Stack panel to see execution flow

### Method 2: Console Logging

The endpoint already includes console.log statements with colored prefixes:

- 🔵 Blue = POST handler execution
- 🟢 Green = GET handler execution

**Watch the terminal** where `npm run dev` is running to see:
```
🔵 [FEEDBACK ENDPOINT] POST handler called
🔵 [FEEDBACK ENDPOINT] Request URL: http://localhost:4321/_ai-coauthor/feedback
🔵 [FEEDBACK ENDPOINT] Request method: POST
```

### Method 3: Manual Node Inspector

Run the dev server with Node's inspector:

```bash
cd playground
node --inspect node_modules/.bin/astro dev
```

Then attach Chrome DevTools:
1. Open Chrome and navigate to `chrome://inspect`
2. Click "Open dedicated DevTools for Node"
3. Set breakpoints in the Sources tab

### Troubleshooting

**Breakpoints not hitting?**
- Verify the endpoint is actually registered by checking Astro's route list
- Check that the widget is sending requests to `/_ai-coauthor/feedback`
- Look for console logs in the terminal to confirm handlers are called

**Storage not working?**
- Check `globalThis.__ASTRO_COAUTHOR__` is defined
- Verify the storage adapter is properly injected in `src/index.ts`
- Check file permissions for the feedback storage file

**Build vs Dev differences?**
- Endpoints work differently in dev (Vite) vs build (static)
- Always test in dev mode when debugging
- Verify `dist/virtual/feedback-endpoint.js` exists after build

### Common Issues

1. **"No API Route handler exists for method POST"**
   - Astro requires uppercase method names: `POST`, `GET`, not `post`, `get`
   - Check exports in feedback-endpoint.js

2. **Widget hitting wrong endpoint**
   - Check `src/client/feedback-widget.ts` fetch URL
   - Verify route is registered in `src/index.ts` with correct pattern

3. **Storage adapter not found**
   - Verify `globalThis.__ASTRO_COAUTHOR__.storage` is set
   - Check integration initialization in playground's astro.config.mjs
