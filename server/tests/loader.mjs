// ESM resolver hook: redirects every import of the production
// `server/openai.js` module to the in-process stub at
// `./openai-stub.mjs`. Activated via `node:module` `register` in
// `./setup.mjs`. Keeps integration tests deterministic and removes
// the runtime dependency on the real OpenAI SDK / API keys.

const stubUrl = new URL('./openai-stub.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (
    specifier === './openai.js' ||
    specifier === '../openai.js' ||
    specifier.endsWith('/server/openai.js')
  ) {
    return { url: stubUrl, format: 'module', shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
