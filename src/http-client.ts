export interface HttpResponse {
  status: number;
  body: unknown;
}

export type Transport = (url: string) => Promise<HttpResponse>;

/** Default total number of requests (first attempt included) made by `requestJson`. */
export const DEFAULT_ATTEMPTS = 3;

export interface RequestOptions {
  /** Total number of requests, including the first one (default `DEFAULT_ATTEMPTS`, i.e. 3). */
  attempts?: number;
  /** @deprecated Use `attempts`. Same meaning: the TOTAL number of requests, so `retries: 1` makes one request and never retries. Ignored when `attempts` is set. */
  retries?: number;
  /** Pause between attempts in milliseconds (default 100). */
  delayMs?: number;
  transport?: Transport;
  sleep?: (ms: number) => Promise<void>;
}

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`GET ${url} failed with status ${status}`);
    this.status = status;
    this.url = url;
  }
}

const defaultTransport: Transport = async (url) => {
  const res = await fetch(url);
  return { status: res.status, body: await res.json().catch(() => null) };
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * GET `url` and return the JSON body, cast to `T`. Server errors (5xx) are retried until `attempts`
 * total requests have been made (`retries` is a deprecated alias for `attempts`); anything else fails at once.
 */
export async function requestJson<T = unknown>(url: string, opts: RequestOptions = {}): Promise<T> {
  const { attempts, retries, delayMs = 100, transport = defaultTransport, sleep = defaultSleep } = opts;
  const total = Math.max(1, attempts ?? retries ?? DEFAULT_ATTEMPTS);
  let failure: HttpError | undefined;
  for (let attempt = 1; attempt <= total; attempt++) {
    if (attempt > 1) await sleep(delayMs);
    const res = await transport(url);
    if (res.status < 400) return res.body as T;
    failure = new HttpError(res.status, url);
    if (res.status < 500) throw failure;
  }
  throw failure;
}
