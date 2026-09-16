const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const mediaOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");

/**
 * Converts backend file-system values such as `public\\temp\\avatar.png`
 * into a browser-accessible URL served by Express at `/temp/avatar.png`.
 */
export function mediaUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const publicPath = value
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^\/?public\//i, "");

  return `${mediaOrigin}/${encodeURI(publicPath)}`;
}
