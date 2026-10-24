export interface HttpResponse {
  status: number;
  body: unknown;
}

export type Transport = (url: string) => Promise<HttpResponse>;

/** Default total number of requests (the first attempt plus any retries). */
export const DEFAULT_ATTEMPTS = 3;

export interface RequestOptions {
  /** Total number of requests, including the first one (default {@link DEFAULT_ATTEMPTS}). `attempts: 1` never retries. */
  attempts?: number;
  /**
   * @deprecated Use `attempts`. Means exactly the same thing: the total number of requests, including the first.
   * When both are given, `attempts` wins.
   */
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
 * GET `url` and return the JSON body (cast to `T`). Server errors (5xx) are retried, up to `attempts`
 * total requests (default {@link DEFAULT_ATTEMPTS}); anything else fails at once.
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
