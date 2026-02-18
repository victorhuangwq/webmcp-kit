# Flight Booking Example

Demo of webmcp-kit with a multi-step flight booking flow.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3001`.

## Testing with Native WebMCP

1. Download [Chrome Canary](https://www.google.com/chrome/canary/) (146+)
2. Go to `chrome://flags` and set "WebMCP for testing" to Enabled
3. Restart browser
4. Open the flight booking app at `http://localhost:3001`

The dev panel will show "Native" when using the real WebMCP API.

## Mock Mode

Works in any browser without setup. The dev panel shows "Mock" and tools run locally.
