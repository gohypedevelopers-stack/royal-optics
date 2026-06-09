import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const banners = await prisma.heroBanner.findMany();
  console.log("Existing banners:", JSON.stringify(banners, null, 2));

  for (const banner of banners) {
    let updatedTitle = banner.title;
    let updatedSubtitle = banner.subtitle;

    if (banner.title.includes("1980")) {
      updatedTitle = banner.title.replace("1980", "1932");
    }
    if (banner.subtitle.includes("2025")) {
      updatedSubtitle = banner.subtitle.replace("2025", "2024");
    }

    // Just in case the subtitle doesn't have 2025 but should be 2024
    if (banner.title.includes("Since 1980") || banner.title.includes("Since 1932")) {
      if (!updatedSubtitle.includes("2024") && !updatedSubtitle.includes("2025")) {
        updatedSubtitle = updatedSubtitle + " in 2024";
      } else if (updatedSubtitle.includes("2025")) {
        updatedSubtitle = updatedSubtitle.replace("2025", "2024");
      }
    }

    if (updatedTitle !== banner.title || updatedSubtitle !== banner.subtitle) {
      await prisma.heroBanner.update({
        where: { id: banner.id },
        data: {
          title: updatedTitle,
          subtitle: updatedSubtitle
        }
      });
      console.log(`Updated banner ID: ${banner.id}`);
      console.log(`New Title: "${updatedTitle}"`);
      console.log(`New Subtitle: "${updatedSubtitle}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
