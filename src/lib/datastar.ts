/**
 * Helper utilities for Datastar SSE responses
 */

import { CacheControl } from './cache-control'

export type Jsonifiable = string | number | boolean | null | undefined | Jsonifiable[] | { [key: string]: Jsonifiable }

function isRecord(obj: unknown): obj is Record<string, Jsonifiable> {
  return typeof obj === 'object' && obj !== null
}

export function setPartialHeaders(
  response: Response,
  selector: string,
  mode = 'inner',
  cache?: 'swr' | 'prevent' | 'forever' | 'require revalidation',
): void {
  response.headers.set('datastar-selector', selector)
  response.headers.set('datastar-mode', mode)
  if (cache) {
    response.headers.set('Cache-Control', new CacheControl(cache).toString())
  }
}

/**
 * Creates a Datastar SSE response that patches HTML elements
 * @param html - The HTML string to send to the client
 * @param signals - Optional signals to update on the client
 */
export function createDatastarResponse(html: string, signals?: Record<string, any>) {
  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    start(controller) {
      // Minify HTML for SSE (remove newlines and extra spaces)
      const minifiedHtml = html.replace(/\s+/g, ' ').trim()

      // Send the HTML patch
      const patchElements = `event: datastar-patch-elements\ndata: elements ${minifiedHtml}\n\n`
      controller.enqueue(encoder.encode(patchElements))

      // Send signal updates if provided
      if (signals) {
        const patchSignals = `event: datastar-patch-signals\ndata: signals ${JSON.stringify(signals)}\n\n`
        controller.enqueue(encoder.encode(patchSignals))
      }

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

/**
 * Creates a Datastar SSE response with JSON signals only (no HTML)
 * @param signals - The signals/data to send to the client
 */
export function createDatastarJsonResponse(signals: Record<string, any>) {
  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    start(controller) {
      // Send only signal updates (no HTML)
      const patchSignals = `event: datastar-patch-signals\ndata: signals ${JSON.stringify(signals)}\n\n`
      controller.enqueue(encoder.encode(patchSignals))

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

/**
 * Extracts signals from the request URL
 */
export function getSignalsFromRequest(request: Request): Record<string, any> {
  const url = new URL(request.url)
  const signalsParam = url.searchParams.get('datastar')

  if (!signalsParam) return {}

  try {
    return JSON.parse(signalsParam)
  } catch (e) {
    console.error('Error parsing signals:', e)
    return {}
  }
}

export async function readSignals(
  request: Request,
): Promise<{ success: true; signals: Record<string, Jsonifiable> } | { success: false; error: string }> {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const params = url.searchParams

    try {
      if (params.has('datastar')) {
        const signals = JSON.parse(params.get('datastar')!)
        if (isRecord(signals)) {
          return { success: true, signals }
        } else throw new Error('Datastar param is not a record')
      } else throw new Error('No datastar object in request')
    } catch (e: unknown) {
      if (isRecord(e) && 'message' in e && typeof e.message === 'string') {
        return { success: false, error: e.message }
      } else {
        return {
          success: false,
          error: 'unknown error when parsing request',
        }
      }
    }
  }
  const body = await request.text()


  try {
    if (typeof body !== 'string') throw Error('body was not a string')
    const parsedBody = JSON.parse(body)

    if (isRecord(parsedBody)) {
      return { success: true, signals: parsedBody }
    } else {
      throw new Error('Parsed JSON body is not of type record')
    }
  } catch (e: unknown) {
    if (isRecord(e) && 'message' in e && typeof e.message === 'string') {
      return { success: false, error: e.message }
    } else {
      return {
        success: false,
        error: 'unknown error when parsing request',
      }
    }
  }
}