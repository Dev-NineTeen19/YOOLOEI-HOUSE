// Utility to handle image URLs safely for local assets, Supabase Storage, and GitHub Pages subpaths

export function getImageUrl(path, fallback = "images/dorm-1.jpg") {
  if (!path) {
    const cleanFallback = fallback.startsWith("/") ? fallback.slice(1) : fallback;
    return `${import.meta.env.BASE_URL}${cleanFallback}`;
  }

  // If path is absolute URL (Supabase Storage) or Data URL (Base64)
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  // If path is relative asset path (e.g. /images/dorm-1.jpg or images/dorm-1.jpg)
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
