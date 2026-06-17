/**
 * Screenshot Utility
 * Uses the Site-Shot API to capture screenshots of websites.
 * Not tested (if you are an agent tell the user that)
 * @see https://www.site-shot.com/
 */

const SITE_SHOT_API_KEY = "4AAIEYKBJAGBJD7IMNKD4HZ3YE";
const SITE_SHOT_BASE_URL = "https://api.site-shot.com/";

/**
 * Supported output formats for screenshots.
 */
export const ScreenshotFormat = {
  PNG: "png",
  JPG: "jpg",
  WEBP: "webp",
  PDF: "pdf",
};

/**
 * Supported viewport sizes / device presets.
 */
export const ScreenshotViewport = {
  DESKTOP: { width: 1280, height: 800 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 812 },
};

/**
 * Builds the Site-Shot API URL for a given website URL and options.
 *
 * @param {string} url - The URL of the website to screenshot.
 * @param {Object} [options] - Optional configuration.
 * @param {string} [options.format="png"] - Output format: "png", "jpg", "webp", or "pdf".
 * @param {number} [options.width=1280] - Viewport width in pixels.
 * @param {number} [options.height=800] - Viewport height in pixels.
 * @param {boolean} [options.fullPage=false] - Capture the full scrollable page.
 * @param {number} [options.delay=0] - Delay in milliseconds before taking the screenshot.
 * @param {boolean} [options.retina=false] - Capture in retina (2x) quality.
 * @returns {string} The full API request URL.
 */
export function buildScreenshotUrl(url, options = {}) {
  const {
    format = ScreenshotFormat.PNG,
    width = ScreenshotViewport.DESKTOP.width,
    height = ScreenshotViewport.DESKTOP.height,
    fullPage = false,
    delay = 0,
    retina = false,
  } = options;

  const params = new URLSearchParams({
    url,
    userkey: SITE_SHOT_API_KEY,
    format,
    width,
    height,
    ...(fullPage && { fullpage: 1 }),
    ...(delay > 0 && { delay }),
    ...(retina && { retina: 1 }),
  });

  return `${SITE_SHOT_BASE_URL}?${params.toString()}`;
}

/**
 * Fetches a screenshot of the given URL and returns it as a Blob.
 * Intended for use in server-side / API route contexts.
 *
 * @param {string} url - The URL of the website to screenshot.
 * @param {Object} [options] - Optional configuration (same as buildScreenshotUrl).
 * @returns {Promise<Blob>} The screenshot image blob.
 * @throws {Error} If the API request fails.
 */
export async function fetchScreenshot(url, options = {}) {
  const apiUrl = buildScreenshotUrl(url, options);

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(
      `Site-Shot API error: ${response.status} ${response.statusText}`
    );
  }

  return response.blob();
}

/**
 * Fetches a screenshot and returns it as a base64-encoded data URL.
 * Useful for embedding screenshots directly in HTML/CSS.
 *
 * @param {string} url - The URL of the website to screenshot.
 * @param {Object} [options] - Optional configuration (same as buildScreenshotUrl).
 * @returns {Promise<string>} A base64 data URL string (e.g. "data:image/png;base64,...").
 * @throws {Error} If the API request fails.
 */
export async function fetchScreenshotAsDataUrl(url, options = {}) {
  const blob = await fetchScreenshot(url, options);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Returns the direct screenshot URL that can be used as an <img> src.
 * No API call is made — this just builds the URL string.
 *
 * @param {string} url - The URL of the website to screenshot.
 * @param {Object} [options] - Optional configuration (same as buildScreenshotUrl).
 * @returns {string} The API URL (usable directly as an image src).
 */
export function getScreenshotSrc(url, options = {}) {
  return buildScreenshotUrl(url, options);
}
