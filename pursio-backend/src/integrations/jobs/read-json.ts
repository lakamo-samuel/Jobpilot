export async function readJobSourceJson(response: Response, maxBytes = 3 * 1024 * 1024): Promise<unknown> {
  if (!response.ok || !response.body) throw new Error("job_source_unavailable");
  if (Number(response.headers.get("content-length")) > maxBytes) throw new Error("job_source_response_too_large");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("job_source_response_too_large");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  return JSON.parse(Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), size).toString("utf8"));
}
