// Only coerce strings that are unambiguously numeric. Matches optional sign,
// integer or decimal, and optional exponent. Rejects empty string, whitespace,
// leading zeros like "0755" (sync tokens / ctags often look like numbers but
// must be preserved verbatim), hex, and anything else.
const NUMERIC_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

export const nativeType = (value: string): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  if (NUMERIC_RE.test(value)) {
    const nValue = Number(value);
    if (!Number.isNaN(nValue) && Number.isFinite(nValue)) {
      return nValue;
    }
  }
  const bValue = value.toLowerCase();
  if (bValue === 'true') {
    return true;
  }
  if (bValue === 'false') {
    return false;
  }
  return value;
};
