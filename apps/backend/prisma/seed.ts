import { PrismaClient, Role } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: resolve(process.cwd(), "..", "..", `.env.${process.env.NODE_ENV ?? "development"}`),
});
const prisma = new PrismaClient();

export class SeedService {
  public async run(): Promise<void> {
    const phc = await prisma.primaryHealthCentre.upsert({
      where: { code: this.required("SEED_PHC_CODE") },
      update: {},
      create: {
        name: this.required("SEED_PHC_NAME"),
        code: this.required("SEED_PHC_CODE"),
        address: this.required("SEED_PHC_ADDRESS"),
        district: this.required("SEED_PHC_DISTRICT"),
        state: this.required("SEED_PHC_STATE"),
      },
    });
    const villages = [
      { name: "Rampur", population: 2400 },
      { name: "Shyampur", population: 1800 },
      { name: "Chandipur", population: 2150 },
      { name: "Krishnapur", population: 2750 },
      { name: "Madhabpur", population: 1950 },
      { name: "Gopalpur", population: 2300 },
      { name: "Haripur", population: 1650 },
      { name: "Sonapur", population: 2600 },
      { name: "Lakshmipur", population: 2050 },
      { name: "Rajapur", population: 2900 },
    ];
    await Promise.all(
      villages.map((village) =>
        prisma.village.upsert({
          where: { phcId_name: { phcId: phc.id, name: village.name } },
          update: {
            district: phc.district,
            state: phc.state,
            population: village.population,
            isActive: true,
          },
          create: {
            ...village,
            district: phc.district,
            state: phc.state,
            phcId: phc.id,
          },
        }),
      ),
    );
    const user = await prisma.user.upsert({
      where: { email: this.required("SEED_ADMIN_EMAIL").toLowerCase() },
      update: { role: Role.PHC_ADMIN },
      create: { email: this.required("SEED_ADMIN_EMAIL").toLowerCase(), role: Role.PHC_ADMIN },
    });
    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: { phcId: phc.id, fullName: this.required("SEED_ADMIN_NAME") },
      create: { userId: user.id, phcId: phc.id, fullName: this.required("SEED_ADMIN_NAME") },
    });
    console.log(`Seeded PHC admin: ${user.email} and ${villages.length} villages.`);
  }
  private required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name}`);
    return value;
  }
}

const seed = new SeedService();
seed
  .run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
