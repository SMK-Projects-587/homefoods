// Randomised delay for cart "add" actions so they read as a real step rather
// than an instant flicker. Kept in a plain (non-component) module since
// calling Math.random() inline in a component body trips the
// react-hooks/purity lint rule.
export function addDelayMs() {
  return 40 + Math.random() * 80;
}
