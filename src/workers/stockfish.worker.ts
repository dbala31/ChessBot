/// <reference lib="webworker" />
/* eslint-disable no-var */

const workerSelf = self as unknown as DedicatedWorkerGlobalScope

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
  workerSelf.postMessage(response)
}

function initEngine() {
  try {
    // Load Stockfish WASM from the public directory.
    // This avoids bundler issues with the npm module's Node.js require() calls.
    engineWorker = new Worker('/stockfish/stockfish.wasm.js')

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

workerSelf.onmessage = (event: MessageEvent<WorkerMessage>) => {
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
