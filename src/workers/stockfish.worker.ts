/// <reference lib="webworker" />

// Stockfish.js is designed to be loaded as a worker. It uses onmessage/postMessage
// internally. We load it via importScripts and relay UCI commands.

declare const self: DedicatedWorkerGlobalScope

interface WorkerMessage {
  readonly type: 'uci-command'
  readonly command: string
}

interface WorkerResponse {
  readonly type: 'uci-output' | 'ready' | 'error'
  readonly line?: string
  readonly error?: string
}

let engineWorker: Worker | null = null

function sendResponse(response: WorkerResponse) {
  self.postMessage(response)
}

function initEngine() {
  try {
    // stockfish.js exposes itself as a worker-compatible module.
    // We create a nested worker from the npm package.
    engineWorker = new Worker(
      new URL('stockfish.js/stockfish.wasm.js', import.meta.url),
    )

    engineWorker.onmessage = (event: MessageEvent<string>) => {
      sendResponse({ type: 'uci-output', line: event.data })
    }

    engineWorker.onerror = (event) => {
      sendResponse({ type: 'error', error: event.message })
    }

    // Initialize UCI
    engineWorker.postMessage('uci')
    sendResponse({ type: 'ready' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to init Stockfish'
    sendResponse({ type: 'error', error: message })
  }
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, command } = event.data

  if (type === 'uci-command') {
    if (!engineWorker) {
      initEngine()
    }
    engineWorker?.postMessage(command)
  }
}

// Auto-initialize on load
initEngine()
