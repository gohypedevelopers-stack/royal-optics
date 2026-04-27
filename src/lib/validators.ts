import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    username: z.string().trim().min(2).max(50).optional(),
    email: z.string().email(),
    phone: z.string().trim().min(10).max(15).optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => Boolean(value.name || value.username), {
    message: "Name is required",
    path: ["name"],
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
  asAdmin: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10).max(15),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default("India"),
  landmark: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const cartAddSchema = z.object({
  productId: z.string().min(10),
  quantity: z.number().int().positive().default(1),
  selectedColor: z.string().optional(),
  lensDetails: z.record(z.string(), z.any()).optional(),
});

export const cartQuantitySchema = z.object({
  cartItemId: z.string().min(10),
  quantity: z.number().int().min(0),
});

export const wishlistSchema = z.object({
  productId: z.string().min(10),
  selectedColor: z.string().optional(),
  lensDetails: z.record(z.string(), z.any()).optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(10).optional(),
  newAddress: addressSchema.optional(),
  promoCode: z.string().max(40).optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
  notes: z.string().max(500).optional(),
});

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional().default(""),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  parentId: z.string().nullable().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional().default(""),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  categoryId: z.string().min(10),
  productType: z.enum(["EYEGLASSES", "SUNGLASSES", "CONTACT_LENSES", "KIDS_EYEWEAR", "ACCESSORIES"]).default("EYEGLASSES"),
  shape: z.string().optional(),
  colors: z.array(z.string()).default([]),
  availableColors: z
    .array(
      z.object({
        name: z.string().min(1),
        hexCode: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
      }),
    )
    .default([]),
  mainImage: z.string().optional(),
  additionalImages: z.array(z.string()).default([]),
  customizationType: z.enum(["EYEGLASSES", "SUNGLASSES", "CONTACT_LENSES", "ACCESSORIES"]),
  powerRange: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("ACTIVE"),
  isTrending: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  featured: z.boolean().default(false),
  imageUrls: z.array(z.string()).default([]),
});

export const blogSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().max(220).optional().default(""),
  content: z.string().min(20),
  author: z.string().min(2).max(100),
  featuredImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const lensPriceSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  description: z.string().max(500).optional().nullable(),
  value: z.coerce.number().min(0),
  valueType: z.enum(["PRICE", "MULTIPLIER"]).default("PRICE"),
  group: z.string().max(120).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const testimonialStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const testimonialCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(12).max(600),
});

const optionalNonNegativeNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().min(0).optional());

const optionalPositiveInteger = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().int().positive().optional());

const optionalDateString = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim();
  return value;
}, z.string().optional());

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(40, "Code cannot exceed 40 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dash or underscore only"),
    description: z
      .preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(300).optional())
      .optional(),
    discountType: z.enum(["FLAT", "PERCENTAGE"]),
    discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
    minOrderAmount: optionalNonNegativeNumber,
    maxDiscountAmount: optionalNonNegativeNumber,
    startsAt: optionalDateString,
    endsAt: optionalDateString,
    usageLimit: optionalPositiveInteger,
    isActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENTAGE" && value.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage discount cannot be greater than 100",
      });
    }

    if (value.startsAt && Number.isNaN(Date.parse(value.startsAt))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Invalid start date",
      });
    }

    if (value.endsAt && Number.isNaN(Date.parse(value.endsAt))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Invalid end date",
      });
    }

    if (value.startsAt && value.endsAt) {
      const startsAt = Date.parse(value.startsAt);
      const endsAt = Date.parse(value.endsAt);
      if (!Number.isNaN(startsAt) && !Number.isNaN(endsAt) && endsAt < startsAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "End date must be after start date",
        });
      }
    }
  });
