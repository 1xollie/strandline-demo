export interface HttpResponse {
  status: number;
  body: unknown;
}

export type Transport = (url: string) => Promise<HttpResponse>;

export interface RequestOptions {
  /** How many times to try AGAIN after the first attempt fails (default 2, so up to 3 requests). */
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

/** GET `url` and return the JSON body. Server errors (5xx) are retried; anything else fails at once. */
export async function requestJson(url: string, opts: RequestOptions = {}): Promise<unknown> {
  const { retries = 2, delayMs = 100, transport = defaultTransport, sleep = defaultSleep } = opts;
  let failure: HttpError | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(delayMs);
    const res = await transport(url);
    if (res.status < 400) return res.body;
    failure = new HttpError(res.status, url);
    if (res.status < 500) throw failure;
  }
  throw failure;
}
