// In-memory file storage as Redis alternative
const fileCache = new Map<string, Buffer>();

export const storeFile = (key: string, buffer: Buffer, ttlSeconds: number = 3600) => {
  fileCache.set(key, buffer);
  
  // Auto-delete after TTL
  setTimeout(() => {
    fileCache.delete(key);
  }, ttlSeconds * 1000);
};

export const getFile = (key: string): Buffer | undefined => {
  return fileCache.get(key);
};

export const deleteFile = (key: string): void => {
  fileCache.delete(key);
};