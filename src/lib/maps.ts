/** 由地點名稱（＋區域，缺則補「東京」）產生 Google 地圖搜尋與導航連結。 */
export function googleMapsUrl(name: string, area?: string): string {
  // 使用 unicode 屬性匹配去除開頭 emoji 與符號，防止拆開 surrogate pair 造成 URIError
  const clean = (name || '').replace(/^[^\p{L}\p{N}]+/gu, '').trim();
  const target = clean || name || '東京';
  const query = `${target} ${area || '東京'}`.trim();
  try {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  } catch {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURI(query)}`;
  }
}
