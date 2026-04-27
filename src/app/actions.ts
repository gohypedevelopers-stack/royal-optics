"use server";

import { revalidatePath } from "next/cache";
import { Prisma, TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { computeUnitPrice } from "@/lib/pricing";
import { CMS_KEYS, defaultSiteProfile } from "@/lib/content";
import { sanitizeBlogContent } from "@/lib/admin";
import {
  removeCartItemById,
  removeWishlistItemById,
  updateCartItemQuantity,
  upsertCartItem,
  upsertWishlistItem,
} from "@/lib/cart";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function boolField(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function revalidateContentPaths(key: string) {
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");

  if (key === CMS_KEYS.terms) revalidatePath("/terms");
  if (key === CMS_KEYS.privacy) revalidatePath("/privacy-policy");
  if (key === CMS_KEYS.policies) revalidatePath("/policies");
  if (key === CMS_KEYS.siteProfile) revalidatePath("/", "layout");
}

export async function addToCartAction(payload: {
  productId: string;
  quantity?: number;
  selectedColor?: string;
  lensDetails?: Prisma.JsonValue;
  customizationType: "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES";
  basePrice: number;
  lensOptionKey?: string;
}) {
  const unitPrice = await computeUnitPrice({
    productPrice: payload.basePrice,
    customizationType: payload.customizationType,
    lensOptionKey: payload.lensOptionKey,
    lensDetails: payload.lensDetails,
  });

  await upsertCartItem({
    productId: payload.productId,
    quantity: payload.quantity || 1,
    selectedColor: payload.selectedColor,
    lensDetails: payload.lensDetails,
    unitPrice,
  });

  revalidatePath("/cart");
  revalidatePath("/products");

  return { success: true };
}

export async function addToWishlistAction(payload: {
  productId: string;
  selectedColor?: string;
  lensDetails?: Prisma.JsonValue;
}) {
  await upsertWishlistItem(payload);

  revalidatePath("/wishlist");
  return { success: true };
}

export async function removeFromCartAction(id: string) {
  const success = await removeCartItemById(id);
  revalidatePath("/cart");
  return { success };
}

export async function updateCartQuantityAction(id: string, quantity: number) {
  const success = await updateCartItemQuantity(id, quantity);
  revalidatePath("/cart");
  return { success };
}

export async function removeFromWishlistAction(id: string) {
  const success = await removeWishlistItemById(id);
  revalidatePath("/wishlist");
  return { success };
}

export async function upsertCategoryAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const status = String(formData.get("status") || "ACTIVE") as "ACTIVE" | "INACTIVE";
  const parentIdRaw = String(formData.get("parentId") || "").trim();
  const parentId = parentIdRaw || null;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  if (id) {
    await prisma.category.update({
      where: { id },
      data: { name, slug, description, imageUrl, status, parentId },
    });
  } else {
    await prisma.category.create({
      data: { name, slug, description, imageUrl, status, parentId },
    });
  }

  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireAdminSession();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export async function upsertLensPriceAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") || "");
  const key = String(formData.get("key") || formData.get("optionKey") || "").trim();
  const title = String(formData.get("title") || formData.get("optionName") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const value = Number(formData.get("value") || formData.get("price") || 0);
  const valueType = String(formData.get("valueType") || "PRICE") as "PRICE" | "MULTIPLIER";
  const group = String(formData.get("group") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const isActive = boolField(formData.get("isActive"));

  if (!key || !title) {
    throw new Error("Lens key and title are required");
  }

  if (id) {
    await prisma.lensPrice.update({
      where: { id },
      data: { key, title, description, value, valueType, group, category, sortOrder, isActive },
    });
  } else {
    await prisma.lensPrice.create({
      data: { key, title, description, value, valueType, group, category, sortOrder, isActive },
    });
  }

  revalidatePath("/admin/lens-prices");
}

export async function upsertSiteProfileAction(formData: FormData) {
  await requireAdminSession();

  const value = {
    name: String(formData.get("name") || defaultSiteProfile.name).trim(),
    legacyText: String(formData.get("legacyText") || defaultSiteProfile.legacyText).trim(),
    phone: String(formData.get("phone") || defaultSiteProfile.phone).trim(),
    supportPhone: String(formData.get("supportPhone") || defaultSiteProfile.supportPhone).trim(),
    email: String(formData.get("email") || defaultSiteProfile.email).trim(),
    address: String(formData.get("address") || defaultSiteProfile.address).trim(),
    logoPath: String(formData.get("logoPath") || defaultSiteProfile.logoPath).trim() || defaultSiteProfile.logoPath,
  };

  await prisma.contentBlock.upsert({
    where: { key: CMS_KEYS.siteProfile },
    update: { value },
    create: { key: CMS_KEYS.siteProfile, value },
  });

  revalidateContentPaths(CMS_KEYS.siteProfile);
}

export async function upsertContentJsonAction(formData: FormData) {
  await requireAdminSession();

  const key = String(formData.get("key") || "").trim();
  const jsonText = String(formData.get("json") || "").trim();

  if (!key || !jsonText) {
    throw new Error("Key and JSON content are required");
  }

  let parsed: Prisma.JsonValue;
  try {
    parsed = JSON.parse(jsonText) as Prisma.JsonValue;
  } catch {
    throw new Error("Invalid JSON format");
  }

  await prisma.contentBlock.upsert({
    where: { key },
    update: { value: parsed },
    create: { key, value: parsed },
  });

  revalidateContentPaths(key);
}

export async function upsertProductAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  const rating = Number(formData.get("rating") || 0);
  const categoryId = String(formData.get("categoryId") || "").trim();
  const productType = String(formData.get("productType") || formData.get("customizationType") || "EYEGLASSES") as any;
  const shape = String(formData.get("shape") || "").trim() || null;
  const colors = String(formData.get("colors") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const mainImage = String(formData.get("mainImage") || "").trim() || null;
  const availableColorsRaw = String(formData.get("availableColors") || "[]");
  let availableColors: Array<{ name: string; hexCode: string }> = [];
  try {
    const parsed = JSON.parse(availableColorsRaw);
    if (Array.isArray(parsed)) {
      availableColors = parsed
        .map((item) => ({
          name: String(item?.name || "").trim(),
          hexCode: String(item?.hexCode || "").trim(),
        }))
        .filter((item) => item.name && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.hexCode));
    }
  } catch {
    availableColors = [];
  }

  const customizationType = String(formData.get("customizationType") || "EYEGLASSES") as any;
  const powerRange = String(formData.get("powerRange") || "").trim() || null;
  const status = String(formData.get("status") || "ACTIVE") as any;
  const isTrending = boolField(formData.get("isTrending"));
  const isFeatured = boolField(formData.get("isFeatured"));
  const featured = boolField(formData.get("featured")) || isFeatured;

  const imageUrls = String(formData.get("imageUrls") || "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!name || !slug || !description || !categoryId) {
    throw new Error("Missing required product fields");
  }

  const data = {
    name,
    slug,
    description,
    price,
    stock,
    rating,
    categoryId,
    productType,
    shape,
    mainImage: mainImage || imageUrls[0] || null,
    colors,
    customizationType,
    powerRange,
    status,
    isTrending,
    isFeatured,
    featured,
  };

  const product = id
    ? await prisma.product.update({ where: { id }, data })
    : await prisma.product.create({ data });

  if (imageUrls.length) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: imageUrls.map((url, index) => ({
        productId: product.id,
        url,
        alt: product.name,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });
  }

  await prisma.productColor.deleteMany({ where: { productId: product.id } });
  if (availableColors.length) {
    await prisma.productColor.createMany({
      data: availableColors.map((item) => ({
        productId: product.id,
        name: item.name,
        hexCode: item.hexCode,
      })),
    });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}`);
  revalidatePath("/products");
}

export async function deleteProductAction(id: string) {
  await requireAdminSession();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}

export async function updateOrderStatusAction(orderId: string, status: any) {
  await requireAdminSession();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
}

export async function deleteOrderAction(orderId: string) {
  await requireAdminSession();
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/admin/orders");
}

export async function deleteUserAction(userId: string) {
  await requireAdminSession();
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function upsertBlogAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = toSlug(String(formData.get("slug") || title));
  const content = String(formData.get("content") || "").trim();
  const author = String(formData.get("author") || "Royal Optics").trim();
  const featuredImage = String(formData.get("featuredImage") || formData.get("imageUrl") || "").trim() || null;
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED";

  if (!title || !slug || !content) {
    throw new Error("Title, slug and content are required");
  }

  if (id) {
    await prisma.blogPost.update({
      where: { id },
      data: { title, slug, content: sanitizeBlogContent(content), author, featuredImage, status },
    });
  } else {
    await prisma.blogPost.create({
      data: { title, slug, content: sanitizeBlogContent(content), author, featuredImage, status },
    });
  }

  revalidatePath("/admin/blogs");
}

export async function deleteBlogAction(id: string) {
  await requireAdminSession();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blogs");
}

export async function updateTestimonialStatusAction(id: string, isApproved: boolean) {
  await requireAdminSession();
  await prisma.testimonial.update({
    where: { id },
    data: {
      isApproved,
      status: isApproved ? TestimonialStatus.APPROVED : TestimonialStatus.REJECTED,
    },
  });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonialAction(id: string) {
  await requireAdminSession();
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
}

