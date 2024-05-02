import { PrismaClient } from "@prisma/client";
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ["info"],
  });
}
prisma = global.prisma;

export default prisma;
