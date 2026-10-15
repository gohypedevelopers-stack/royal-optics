import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma";
import { productFilterHref } from "./product-filters";
import { GET } from "../app/api/products/[id]/image/route";

test("pagination preserves filters and filter changes reset the page", () => {
  const current = { category: "eyeglasses", sub: "men", q: "frame", page: "3" };
  const next = new URL(productFilterHref(current, { page: "4" }), "https://example.com");
  assert.equal(next.searchParams.get("page"), "4");
  assert.equal(next.searchParams.get("category"), "eyeglasses");
  assert.equal(next.searchParams.get("sub"), "men");
  assert.equal(next.searchParams.get("q"), "frame");
  assert.ok(!productFilterHref(current, { sub: "women" }).includes("page="));
});

test("legacy image endpoint returns cacheable image bytes and handles missing products", async () => {
  const original = prisma.product.findFirst;
  let product: { mainImage: string; images: [] } | null = {
    mainImage: "data:image/png;base64,aGVsbG8=", images: [],
  };
  prisma.product.findFirst = (async (args: any) => {
    assert.deepEqual(args.where, { id: "test", status: "ACTIVE" });
    return product;
  }) as unknown as typeof original;
  try {
    const request = new Request("https://example.com/api/products/test/image");
    const context = { params: Promise.resolve({ id: "test" }) };
    const response = await GET(request, context);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "public, max-age=300");
    assert.equal(await response.text(), "hello");
    product = { mainImage: "/uploads/replacement.jpg", images: [] };
    assert.equal((await GET(request, context)).headers.get("location"), "https://example.com/uploads/replacement.jpg");
    product = null;
    assert.equal((await GET(request, context)).status, 404);
  } finally {
    prisma.product.findFirst = original;
  }
});
