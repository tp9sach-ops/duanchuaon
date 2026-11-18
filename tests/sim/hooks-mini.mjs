export async function resolve(spec, ctx, next) { if (spec === 'three') return { url: new URL('./three-mini.mjs', import.meta.url).href, shortCircuit: true }; return next(spec, ctx); }
