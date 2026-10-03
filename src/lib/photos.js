/** @type {Record<string, import('astro').ImageMetadata>} */
const files = import.meta.glob('../assets/photos/*', { eager: true, import: 'default' });

/**
 * @param {string} name
 * @returns {import('astro').ImageMetadata}
 */
export function photo(name) {
  const key = Object.keys(files).find((k) => k.split('/').pop().split('.')[0] === name);
  if (!key) throw new Error(`No photo named ${name}`);
  return files[key];
}
