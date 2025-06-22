import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Could not generate QR code');
  }
}; 