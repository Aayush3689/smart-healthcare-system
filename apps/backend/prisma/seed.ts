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
    console.log(`Seeded PHC admin: ${user.email}`);
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
