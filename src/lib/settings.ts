import { prisma } from "@/lib/prisma";

const SETTINGS_ID = 1;
const DEFAULT_POINTS_PER_WIN = 1;

export async function getPointsPerWin(): Promise<number> {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  return settings?.pointsPerWin ?? DEFAULT_POINTS_PER_WIN;
}

export async function setPointsPerWin(pointsPerWin: number): Promise<void> {
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, pointsPerWin },
    update: { pointsPerWin },
  });
}
