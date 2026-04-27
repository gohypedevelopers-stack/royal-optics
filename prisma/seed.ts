import {
  BlogStatus,
  CategoryStatus,
  CustomizationType,
  LensValueType,
  PrismaClient,
  ProductStatus,
  ProductType,
  PromoDiscountType,
  TestimonialStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type LensSeed = {
  title: string;
  description: string;
  key: string;
  valueType: LensValueType;
  category: string;
  group: string;
  sortOrder: number;
  isActive: boolean;
  value: number;
};

function buildPrescriptionSeed(prefix: "psv" | "pbf" | "ppg", category: string): LensSeed[] {
  const singleVisionBlueprint: Array<{ group: string; title: string; description: string; key: string }> = [
    {
      group: "Clear & Anti Reflection Lenses",
      title: "Clear - Basic",
      description: "Clear lenses for all-day use",
      key: "psv_clear_basic",
    },
    {
      group: "Clear & Anti Reflection Lenses",
      title: "Anti Reflection - Premium",
      description: "Good for digital work (< 4 hours) and daily activity",
      key: "psv_clear_premium",
    },
    {
      group: "Blu Block Lenses",
      title: "Blu Block - Basic (40%)",
      description: "~40% blue-light filtration",
      key: "psv_blublock_basic",
    },
    {
      group: "Blu Block Lenses",
      title: "Blu Block - Advance (60%)",
      description: "~60% blue-light filtration",
      key: "psv_blublock_advance",
    },
    {
      group: "Blu Block Lenses",
      title: "Blu Block - Premium (90%)",
      description: "~90% blue-light filtration",
      key: "psv_blublock_premium",
    },
    {
      group: "Blu Block Lenses",
      title: "Blu Block - Exclusive (90% + Hydrophobic)",
      description: "~90% + hydrophobic",
      key: "psv_blublock_exclusive",
    },
    {
      group: "Polycarbonate Lenses",
      title: "Polycarbonate - Anti Reflection",
      description: "Unbreakable; ideal for rimless",
      key: "psv_poly_ar",
    },
    {
      group: "Polycarbonate Lenses",
      title: "Polycarbonate - Blu Block",
      description: "Unbreakable; ideal for rimless",
      key: "psv_poly_blublock",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Grey Tint - 25% Dark",
      description: "Light grey tint",
      key: "psv_driving_tinted_grey_25",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Grey Tint - 50% Dark",
      description: "Medium grey tint",
      key: "psv_driving_tinted_grey_50",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Grey Tint - 75% Dark",
      description: "Dark grey tint",
      key: "psv_driving_tinted_grey_75",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Grey Tint - 90% Dark",
      description: "Very dark grey tint",
      key: "psv_driving_tinted_grey_90",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Green Tint - 25% Dark",
      description: "Light green tint",
      key: "psv_driving_tinted_green_25",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Green Tint - 50% Dark",
      description: "Medium green tint",
      key: "psv_driving_tinted_green_50",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Green Tint - 75% Dark",
      description: "Dark green tint",
      key: "psv_driving_tinted_green_75",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Green Tint - 90% Dark",
      description: "Very dark green tint",
      key: "psv_driving_tinted_green_90",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Brown Tint - 25% Dark",
      description: "Light brown tint",
      key: "psv_driving_tinted_brown_25",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Brown Tint - 50% Dark",
      description: "Medium brown tint",
      key: "psv_driving_tinted_brown_50",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Brown Tint - 75% Dark",
      description: "Dark brown tint",
      key: "psv_driving_tinted_brown_75",
    },
    {
      group: "Driving Lenses (Tinted UV)",
      title: "Brown Tint - 90% Dark",
      description: "Very dark brown tint",
      key: "psv_driving_tinted_brown_90",
    },
    {
      group: "Day & Night Lenses",
      title: "Day & Night - Basic",
      description: "Photochromic",
      key: "psv_day_night_basic",
    },
    {
      group: "Day & Night Lenses",
      title: "Day & Night - Turbo",
      description: "Faster transitions",
      key: "psv_day_night_turbo",
    },
    {
      group: "Polarized Lenses",
      title: "Polarized - Basic (front 5-layer)",
      description: "Anti-glare",
      key: "psv_polarized_basic",
    },
    {
      group: "Polarized Lenses",
      title: "Polarized - Premium (+AR, back 5)",
      description: "Back AR + better lamination",
      key: "psv_polarized_premium",
    },
  ];

  return singleVisionBlueprint.map((item, index) => ({
    title: item.title,
    description: item.description,
    key: item.key.replace("psv_", `${prefix}_`),
    valueType: LensValueType.PRICE,
    category,
    group: item.group,
    sortOrder: index + 1,
    isActive: true,
    value: 0,
  }));
}

function buildLensSeedData(): LensSeed[] {
  const reader: LensSeed[] = [
    {
      title: "Reader: Clear - Basic",
      description: "Ready readers, clear",
      key: "reader_clear_basic",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 1,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Anti Reflection - Premium",
      description: "Ready readers, AR premium",
      key: "reader_clear_premium",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 2,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Blu Block - Basic (40%)",
      description: "~40% blue-light filtration",
      key: "reader_blublock_basic",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 3,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Blu Block - Advance (60%)",
      description: "~60% blue-light filtration",
      key: "reader_blublock_advance",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 4,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Blu Block - Premium (90%)",
      description: "~90% blue-light filtration",
      key: "reader_blublock_premium",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 5,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Polycarbonate - Anti Reflection",
      description: "Unbreakable; rimless OK",
      key: "reader_poly_ar",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 6,
      isActive: true,
      value: 0,
    },
    {
      title: "Reader: Polycarbonate - Blu Block",
      description: "Unbreakable; rimless OK",
      key: "reader_poly_blublock",
      valueType: LensValueType.PRICE,
      category: "Reader",
      group: "Reader",
      sortOrder: 7,
      isActive: true,
      value: 0,
    },
  ];

  const nonRx: LensSeed[] = [
    {
      title: "Non-Rx: Clear - Basic",
      description: "Zero power clear",
      key: "nonrx_clear_basic",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 1,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Anti Reflection - Premium",
      description: "Zero power AR premium",
      key: "nonrx_clear_premium",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 2,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Blu Block - Basic (40%)",
      description: "~40% blue-light filtration",
      key: "nonrx_blublock_basic",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 3,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Blu Block - Advance (60%)",
      description: "~60% blue-light filtration",
      key: "nonrx_blublock_advance",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 4,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Blu Block - Premium (90%)",
      description: "~90% blue-light filtration",
      key: "nonrx_blublock_premium",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 5,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Polycarbonate - Anti Reflection",
      description: "Unbreakable; rimless OK",
      key: "nonrx_poly_ar",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 6,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Rx: Polycarbonate - Blu Block",
      description: "Unbreakable; rimless OK",
      key: "nonrx_poly_blublock",
      valueType: LensValueType.PRICE,
      category: "Non-Prescription",
      group: "Non-Prescription",
      sortOrder: 7,
      isActive: true,
      value: 0,
    },
  ];

  const sunglasses: LensSeed[] = [
    {
      title: "Tinted UV (any color & darkness)",
      description: "~50% UV protection",
      key: "drv_tinted_uv",
      valueType: LensValueType.PRICE,
      category: "Sunglasses / Driving",
      group: "Sunglasses / Driving",
      sortOrder: 1,
      isActive: true,
      value: 0,
    },
    {
      title: "Day & Night - Basic",
      description: "Photochromic",
      key: "drv_day_night_basic",
      valueType: LensValueType.PRICE,
      category: "Sunglasses / Driving",
      group: "Sunglasses / Driving",
      sortOrder: 2,
      isActive: true,
      value: 0,
    },
    {
      title: "Day & Night - Turbo",
      description: "Faster transitions",
      key: "drv_day_night_turbo",
      valueType: LensValueType.PRICE,
      category: "Sunglasses / Driving",
      group: "Sunglasses / Driving",
      sortOrder: 3,
      isActive: true,
      value: 0,
    },
    {
      title: "Polarized - Basic (front 5-layer)",
      description: "Anti-glare",
      key: "drv_polarized_basic",
      valueType: LensValueType.PRICE,
      category: "Sunglasses / Driving",
      group: "Sunglasses / Driving",
      sortOrder: 4,
      isActive: true,
      value: 0,
    },
    {
      title: "Polarized - Premium (+AR, back 5)",
      description: "Back AR + better lamination",
      key: "drv_polarized_premium",
      valueType: LensValueType.PRICE,
      category: "Sunglasses / Driving",
      group: "Sunglasses / Driving",
      sortOrder: 5,
      isActive: true,
      value: 0,
    },
  ];

  const global: LensSeed[] = [
    {
      title: "Contact Lens Price Per Box",
      description: "Per box add-on over product price",
      key: "contact_lens_box_price",
      valueType: LensValueType.PRICE,
      category: "Global Add-ons & Multipliers",
      group: "Global Add-ons & Multipliers",
      sortOrder: 1,
      isActive: true,
      value: 0,
    },
    {
      title: "Sunglasses Base Multiplier",
      description: "Multiply base product price for Only Sunglass e.g. 1.25",
      key: "sunglasses_base_multiplier",
      valueType: LensValueType.MULTIPLIER,
      category: "Global Add-ons & Multipliers",
      group: "Global Add-ons & Multipliers",
      sortOrder: 2,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Power Lens Multiplier SS1",
      description: "Optional multiplier for Non-Power Lens SS1",
      key: "nonpower_multiplier_ss1",
      valueType: LensValueType.MULTIPLIER,
      category: "Global Add-ons & Multipliers",
      group: "Global Add-ons & Multipliers",
      sortOrder: 3,
      isActive: true,
      value: 0,
    },
    {
      title: "Non-Power Lens Multiplier SS2",
      description: "Optional multiplier for Non-Power Lens SS2",
      key: "nonpower_multiplier_ss2",
      valueType: LensValueType.MULTIPLIER,
      category: "Global Add-ons & Multipliers",
      group: "Global Add-ons & Multipliers",
      sortOrder: 4,
      isActive: true,
      value: 0,
    },
  ];

  return [
    ...buildPrescriptionSeed("psv", "Prescription - Single Vision"),
    ...buildPrescriptionSeed("pbf", "Prescription - Bifocal"),
    ...buildPrescriptionSeed("ppg", "Prescription - Progressive"),
    ...reader,
    ...nonRx,
    ...sunglasses,
    ...global,
  ];
}

async function main() {
  const adminUsername = process.env.ADMIN_SEED_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@royaloptics.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@123";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const userPasswordHash = await bcrypt.hash("User@123", 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { email: adminEmail, passwordHash: adminPasswordHash },
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminPasswordHash,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "customer@royaloptics.com" },
    update: {
      username: "royalcustomer",
      phone: "9999999999",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
    create: {
      username: "royalcustomer",
      email: "customer@royaloptics.com",
      phone: "9999999999",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const eyewear = await prisma.category.upsert({
    where: { slug: "eyewear" },
    update: {
      description: "Core eyewear category root",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/Eyeglasses.jpg",
    },
    create: {
      name: "Eyewear",
      slug: "eyewear",
      description: "Core eyewear category root",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/Eyeglasses.jpg",
    },
  });

  const eyeglasses = await prisma.category.upsert({
    where: { slug: "eyeglasses" },
    update: {
      description: "Classic and modern optical eyeglasses",
      status: CategoryStatus.ACTIVE,
      parentId: eyewear.id,
      imageUrl: "/Eyeglasses.jpg",
    },
    create: {
      name: "Eyeglasses",
      slug: "eyeglasses",
      description: "Classic and modern optical eyeglasses",
      status: CategoryStatus.ACTIVE,
      parentId: eyewear.id,
      imageUrl: "/Eyeglasses.jpg",
    },
  });

  const sunglasses = await prisma.category.upsert({
    where: { slug: "sunglasses" },
    update: {
      description: "Polarized and UV-protected sunglasses",
      status: CategoryStatus.ACTIVE,
      parentId: eyewear.id,
      imageUrl: "/Sunglasses.jpg",
    },
    create: {
      name: "Sunglasses",
      slug: "sunglasses",
      description: "Polarized and UV-protected sunglasses",
      status: CategoryStatus.ACTIVE,
      parentId: eyewear.id,
      imageUrl: "/Sunglasses.jpg",
    },
  });

  const contacts = await prisma.category.upsert({
    where: { slug: "contact-lenses" },
    update: {
      description: "Power and cosmetic contact lenses",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/category-contact-lenses.png",
    },
    create: {
      name: "Contact Lenses",
      slug: "contact-lenses",
      description: "Power and cosmetic contact lenses",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/category-contact-lenses.png",
    },
  });

  const kids = await prisma.category.upsert({
    where: { slug: "kids-eyewear" },
    update: {
      description: "Safe and lightweight eyewear for kids",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/category-accessories.png",
    },
    create: {
      name: "Kids Eyewear",
      slug: "kids-eyewear",
      description: "Safe and lightweight eyewear for kids",
      status: CategoryStatus.ACTIVE,
      imageUrl: "/category-accessories.png",
    },
  });

  const products = [
    {
      name: "Royal Titanium Edge",
      slug: "royal-titanium-edge",
      description: "Premium lightweight titanium frame for everyday professional wear.",
      price: 4899,
      stock: 36,
      rating: 4.7,
      categoryId: eyeglasses.id,
      productType: ProductType.EYEGLASSES,
      customizationType: CustomizationType.EYEGLASSES,
      shape: "Rectangle",
      powerRange: "GENERAL_EYEWEAR",
      status: ProductStatus.ACTIVE,
      isTrending: true,
      isFeatured: true,
      featured: true,
      mainImage: "/ban1.jpg",
      imageUrls: ["/ban1.jpg", "/ban2.jpg"],
      colors: ["Black", "Gunmetal", "Blue"],
      productColors: [
        { name: "Black", hexCode: "#111111" },
        { name: "Gunmetal", hexCode: "#4B5563" },
        { name: "Blue", hexCode: "#1D4ED8" },
      ],
    },
    {
      name: "Royal Aviator Polar",
      slug: "royal-aviator-polar",
      description: "Polarized aviator sunglasses with UV400 protection.",
      price: 5299,
      stock: 18,
      rating: 4.8,
      categoryId: sunglasses.id,
      productType: ProductType.SUNGLASSES,
      customizationType: CustomizationType.SUNGLASSES,
      shape: "Aviator",
      powerRange: "GENERAL_EYEWEAR",
      status: ProductStatus.ACTIVE,
      isTrending: true,
      isFeatured: true,
      featured: true,
      mainImage: "/Sunglasses.jpg",
      imageUrls: ["/Sunglasses.jpg", "/ban3.jpg"],
      colors: ["Black", "Brown", "Green"],
      productColors: [
        { name: "Black", hexCode: "#0F172A" },
        { name: "Brown", hexCode: "#7C2D12" },
        { name: "Green", hexCode: "#166534" },
      ],
    },
    {
      name: "Royal Aqua Monthly",
      slug: "royal-aqua-monthly",
      description: "Monthly disposable power contact lenses with high moisture retention.",
      price: 999,
      stock: 220,
      rating: 4.6,
      categoryId: contacts.id,
      productType: ProductType.CONTACT_LENSES,
      customizationType: CustomizationType.CONTACT_LENSES,
      shape: "Round",
      powerRange: "TYPE_2",
      status: ProductStatus.ACTIVE,
      isTrending: true,
      isFeatured: false,
      featured: false,
      mainImage: "/category-contact-lenses.png",
      imageUrls: ["/category-contact-lenses.png"],
      colors: ["Clear"],
      productColors: [{ name: "Clear", hexCode: "#E2E8F0" }],
    },
    {
      name: "Royal Junior Flex",
      slug: "royal-junior-flex",
      description: "Flexible and safe eyeglasses for growing kids.",
      price: 2499,
      stock: 14,
      rating: 4.4,
      categoryId: kids.id,
      productType: ProductType.KIDS_EYEWEAR,
      customizationType: CustomizationType.EYEGLASSES,
      shape: "Oval",
      powerRange: "TYPE_1",
      status: ProductStatus.ACTIVE,
      isTrending: false,
      isFeatured: true,
      featured: true,
      mainImage: "/ban2.jpg",
      imageUrls: ["/ban2.jpg", "/ban1.jpg"],
      colors: ["Blue", "Red"],
      productColors: [
        { name: "Blue", hexCode: "#2563EB" },
        { name: "Red", hexCode: "#DC2626" },
      ],
    },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        stock: item.stock,
        rating: item.rating,
        categoryId: item.categoryId,
        productType: item.productType,
        customizationType: item.customizationType,
        shape: item.shape,
        powerRange: item.powerRange,
        status: item.status,
        isTrending: item.isTrending,
        isFeatured: item.isFeatured,
        featured: item.featured,
        mainImage: item.mainImage,
        colors: item.colors,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        stock: item.stock,
        rating: item.rating,
        categoryId: item.categoryId,
        productType: item.productType,
        customizationType: item.customizationType,
        shape: item.shape,
        powerRange: item.powerRange,
        status: item.status,
        isTrending: item.isTrending,
        isFeatured: item.isFeatured,
        featured: item.featured,
        mainImage: item.mainImage,
        colors: item.colors,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: item.imageUrls.map((url, index) => ({
        productId: product.id,
        url,
        alt: item.name,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });

    await prisma.productColor.deleteMany({ where: { productId: product.id } });
    await prisma.productColor.createMany({
      data: item.productColors.map((color) => ({
        productId: product.id,
        name: color.name,
        hexCode: color.hexCode,
      })),
    });
  }

  const lensSeeds = buildLensSeedData();
  for (const lens of lensSeeds) {
    await prisma.lensPrice.upsert({
      where: { key: lens.key },
      update: {
        title: lens.title,
        description: lens.description,
        value: lens.value,
        valueType: lens.valueType,
        category: lens.category,
        group: lens.group,
        sortOrder: lens.sortOrder,
        isActive: lens.isActive,
      },
      create: {
        key: lens.key,
        title: lens.title,
        description: lens.description,
        value: lens.value,
        valueType: lens.valueType,
        category: lens.category,
        group: lens.group,
        sortOrder: lens.sortOrder,
        isActive: lens.isActive,
      },
    });
  }

  await prisma.blogPost.upsert({
    where: { slug: "how-to-pick-eye-frame-for-face-shape" },
    update: {
      status: BlogStatus.PUBLISHED,
      featuredImage: "/ban1.jpg",
    },
    create: {
      title: "How to Pick the Right Frame for Your Face Shape",
      slug: "how-to-pick-eye-frame-for-face-shape",
      content:
        "Find your ideal frame by balancing contrast, proportion, and daily comfort. Royal Optics brings classic guidance into a modern shopping experience.",
      author: "Royal Optics",
      featuredImage: "/ban1.jpg",
      status: BlogStatus.PUBLISHED,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "blue-light-lenses-explained" },
    update: {
      status: BlogStatus.PUBLISHED,
      featuredImage: "/ban2.jpg",
    },
    create: {
      title: "Blue Light Lenses Explained",
      slug: "blue-light-lenses-explained",
      content:
        "Blu-block coatings can reduce glare from digital screens and improve comfort during long office sessions.",
      author: "Royal Optics",
      featuredImage: "/ban2.jpg",
      status: BlogStatus.PUBLISHED,
    },
  });

  await prisma.testimonial.deleteMany({
    where: {
      email: {
        in: ["aman@example.com", "sana@example.com", "ravi@example.com"],
      },
    },
  });
  await prisma.testimonial.createMany({
    data: [
      {
        userId: demoUser.id,
        name: "Aman Gupta",
        email: "aman@example.com",
        rating: 5,
        message: "Very smooth lens customization and perfect fit. Loved the service.",
        isApproved: true,
        status: TestimonialStatus.APPROVED,
      },
      {
        name: "Sana Khan",
        email: "sana@example.com",
        rating: 4,
        message: "Great collection and transparent pricing. Delivery was quick.",
        isApproved: true,
        status: TestimonialStatus.APPROVED,
      },
      {
        name: "Ravi Sharma",
        email: "ravi@example.com",
        rating: 5,
        message: "Please approve this testimonial from admin before showing publicly.",
        isApproved: false,
        status: TestimonialStatus.PENDING,
      },
    ],
  });

  await prisma.heroBanner.createMany({
    data: [
      {
        title: "Royal Opticians Since 1980",
        subtitle: "Trusted craftsmanship now online as Royal Optics",
        imageUrl: "/ban1.jpg",
        ctaLabel: "Shop Eyeglasses",
        ctaHref: "/products?category=eyeglasses",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Premium Sunglasses Collection",
        subtitle: "Polarized and prescription-ready sunglass options",
        imageUrl: "/ban2.jpg",
        ctaLabel: "Explore Sunglasses",
        ctaHref: "/products?category=sunglasses",
        sortOrder: 2,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.whyChooseItem.createMany({
    data: [
      {
        title: "Expert Lens Guidance",
        description: "Step-by-step lens selection with clear pricing at every stage.",
        iconName: "Glasses",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Fast Shipping",
        description: "Quick order processing and reliable dispatch across India.",
        iconName: "Truck",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Secure Payments",
        description: "Razorpay prepaid checkout with signature verification.",
        iconName: "ShieldCheck",
        sortOrder: 3,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.promoCode.upsert({
    where: { code: "ROYAL10" },
    update: {},
    create: {
      code: "ROYAL10",
      description: "10% off on prepaid orders",
      discountType: PromoDiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 1999,
      maxDiscountAmount: 1200,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "FIRST500" },
    update: {},
    create: {
      code: "FIRST500",
      description: "Flat Rs.500 off",
      discountType: PromoDiscountType.FLAT,
      discountValue: 500,
      minOrderAmount: 4000,
      isActive: true,
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-default-address" },
    update: {},
    create: {
      id: "seed-default-address",
      userId: demoUser.id,
      fullName: "Royal Customer",
      phone: "9999999999",
      addressLine1: "1169, 6 Tooti Chowk, Main Bazar",
      addressLine2: "Pahar Ganj",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110055",
      country: "India",
      landmark: "Near Main Bazar",
      isDefault: true,
    },
  });

  console.log(`Seed completed. Lens entries: ${lensSeeds.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
