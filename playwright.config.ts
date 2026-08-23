import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

// Chromium's built-in fake device delivers silence in the headless shell, so the
// tone comes from a file instead. That also makes the assertion specific: the
// tuner must report A4, not merely "something".
const fakeAudioFile = fileURLToPath(new URL('./e2e/fixtures/a4-440.wav', import.meta.url))

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  use: {
    // The headless shell has no audio subsystem, so getUserMedia returns a
    // silent track there. The full Chromium build does capture the fed file.
    channel: 'chromium',
    baseURL: 'http://localhost:5173',
    permissions: ['microphone'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${fakeAudioFile}`,
      ],
    },
  },
})
