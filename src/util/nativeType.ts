export const nativeType = (value: any): any => {
  const nValue = Number(value);
  if (!Number.isNaN(nValue)) {
    return nValue;
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
