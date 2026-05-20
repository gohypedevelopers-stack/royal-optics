import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: "dailes" },
  });

  if (!product) {
    console.log("Dailes product not found!");
    return;
  }

  const payload = {
    name: "Dailes",
    slug: "dailes",
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    rating: Number(product.rating),
    categoryId: product.categoryId,
    productType: product.productType,
    customizationType: product.customizationType,
    mainImage: "/uploads/1779275026582-download.jpg",
    additionalImages: [],
    imageUrls: [],
    availableColors: [],
    status: product.status,
  };

  const imageUrls = payload.additionalImages.length ? payload.additionalImages : payload.imageUrls;
  const mainImage = payload.mainImage || imageUrls[0] || null;

  const combinedImages: string[] = [];
  if (mainImage) {
    combinedImages.push(mainImage);
  }
  imageUrls.forEach((url) => {
    if (url !== mainImage && !combinedImages.includes(url)) {
      combinedImages.push(url);
    }
  });

  console.log("combinedImages:", combinedImages);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: {
        mainImage,
      },
    });

    await tx.productImage.deleteMany({ where: { productId: product.id } });
    if (combinedImages.length) {
      const created = await tx.productImage.createMany({
        data: combinedImages.map((url, index) => ({
          productId: product.id,
          url,
          alt: payload.name,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
      console.log("created count in tx:", created);
    }
    return updatedProduct;
  });

  console.log("Updated in DB mainImage:", updated.mainImage);
  const images = await prisma.productImage.findMany({ where: { productId: product.id } });
  console.log("Images now in DB:", images);
}

main().catch(console.error).finally(() => prisma.$disconnect());
