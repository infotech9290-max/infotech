import imageCompression from 'browser-image-compression';

export const compressImage = async (imageFile: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: false, // false forces it to run reliably without hanging the Promise in Dev environments
  };
  
  try {
    // Await compression directly (no artificial timeout, so it always compresses)
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};
