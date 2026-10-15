export type ProductSearchParams = Record<string, string | string[] | undefined>;

export function productFilterHref(
  current: ProductSearchParams,
  updates: Record<string, string | null>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  params.delete("page");
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function categoryFilterIds(
  slug: string,
  categories: Array<{ id: string; slug: string; parentId: string | null }>,
) {
  if (!slug) return undefined;
  const root = categories.find((category) => category.slug === slug);
  if (!root) return [];
  const ids = new Set([root.id]);
  const queue = [root.id];
  while (queue.length) {
    const parentId = queue.shift();
    for (const category of categories) {
      if (category.parentId === parentId && !ids.has(category.id)) {
        ids.add(category.id);
        queue.push(category.id);
      }
    }
  }
  return [...ids];
}
