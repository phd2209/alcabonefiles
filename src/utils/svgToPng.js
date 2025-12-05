/**
 * Utility to convert SVG to PNG for downloading
 */

/**
 * Convert an SVG element to a PNG data URL
 * @param {SVGElement} svgElement - The SVG element to convert
 * @param {number} scale - Scale multiplier for resolution (2 = 2x, for high DPI)
 * @returns {Promise<string>} PNG data URL
 */
export async function svgToPng(svgElement, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);

      // Get dimensions
      const width = parseFloat(svgClone.getAttribute('width')) || svgElement.clientWidth;
      const height = parseFloat(svgClone.getAttribute('height')) || svgElement.clientHeight;

      // Serialize the SVG to string
      const svgString = new XMLSerializer().serializeToString(svgClone);

      // Create a blob from the SVG string
      const svg64 = btoa(unescape(encodeURIComponent(svgString)));
      const image64 = 'data:image/svg+xml;base64,' + svg64;

      // Create an image element
      const img = new Image();

      img.onload = () => {
        // Create canvas with scaled dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');

        // Fill with white background (in case of transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load SVG image: ' + error));
      };

      img.src = image64;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download a data URL as a file
 * @param {string} dataUrl - The data URL to download
 * @param {string} filename - Desired filename
 */
export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert SVG to PNG and trigger download
 * @param {SVGElement} svgElement - The SVG element
 * @param {string} filename - Desired filename
 * @param {number} scale - Resolution scale
 */
export async function downloadSvgAsPng(svgElement, filename = 'wanted-poster.png', scale = 2) {
  try {
    const pngDataUrl = await svgToPng(svgElement, scale);
    downloadDataUrl(pngDataUrl, filename);
  } catch (error) {
    console.error('Error downloading SVG as PNG:', error);
    throw error;
  }
}
