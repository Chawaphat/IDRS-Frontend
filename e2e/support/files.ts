/** Synthetic upload payloads for the STC-22 Required Test Data. */

// Minimal valid 1x1 JPEG.
const JPEG_1PX = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
    'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
    'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
  'base64',
);

/** A valid intraoral photo: `xray_001.jpg` (JPG, ~2 MB). */
export const validImage = () => ({
  name: 'xray_001.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(2 * 1024 * 1024)]),
});

/** A second valid image, for panoramic-replacement scripts. */
export const validPanoramic = () => ({
  name: 'pano_new.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(1024 * 1024)]),
});

/** An unsupported file type: `report.pdf`. */
export const unsupportedFile = () => ({
  name: 'report.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n% mock report\n'),
});

/** An oversized image: `huge.jpg` (12 MB > 10 MB limit). */
export const oversizedImage = () => ({
  name: 'huge.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(12 * 1024 * 1024)]),
});

/** STC-26 (AI Analysis page) Required Test Data. */

/** A valid panoramic X-ray: `pano_xray.jpg` (JPG, 4 MB). */
export const validPanoramicXray = () => ({
  name: 'pano_xray.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(4 * 1024 * 1024)]),
});

/** A second valid panoramic X-ray, for "Change X-ray". */
export const differentPanoramicXray = () => ({
  name: 'pano_xray_2.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(1024 * 1024)]),
});

/** An unsupported file type for the AI Analysis page: `notes.txt`. */
export const unsupportedTextFile = () => ({
  name: 'notes.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('not an image'),
});

/** An oversized panoramic X-ray: `huge_pano.jpg` (18 MB > the AI Analysis page's 15 MB limit). */
export const oversizedPanoramic = () => ({
  name: 'huge_pano.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.concat([JPEG_1PX, Buffer.alloc(18 * 1024 * 1024)]),
});
