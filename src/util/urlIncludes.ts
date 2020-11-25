export const urlIncludes = (urlA: string, urlB: string): boolean => {
  if (!urlA || !urlB) {
    return false;
  }
  const trimmedUrlA = urlA.trim();
  const trimmedUrlB = urlB.trim();
  const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
  const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
  return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};
