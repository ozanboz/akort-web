# Akort+ Web

Browser tuner for Turkish makam and Western music. Runs entirely on the device —
audio never leaves the browser.

## Why the koma system

Turkish makam music divides the octave into 53 equal steps rather than 12. That
choice is not arbitrary: 53 fifths land within 3.6 cents of 31 octaves, so the
Pythagorean circle very nearly closes.

| Interval | Pure ratio | 53-EDO | Error | 12-TET error |
|---|---|---|---|---|
| Fifth | 3/2 = 701.955¢ | 31 komas = 701.887¢ | 0.068¢ | 1.955¢ |
| Major third | 5/4 = 386.314¢ | 17 komas = 384.906¢ | 1.408¢ | 13.686¢ |

One koma is 22.64 cents, which is why the pitch estimator interpolates between
samples: without it, quantisation at A4 is roughly 17 cents.

## How it works

`getUserMedia` opens the microphone, an `AudioWorklet` copies samples into a
ring buffer, and a Web Worker runs the YIN estimator on 2048-sample windows.
Keeping YIN off both the audio thread and the main thread matters: a render
quantum must finish in about 2.9 ms, and YIN costs roughly 930k operations.

## Development

    npm install
    npm run dev
    npm test
    npm run test:e2e

## Related

The native iOS app: [Akort+](https://akortplus.com)
