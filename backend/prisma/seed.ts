import { prisma } from "../src/config/database";
import bcrypt from "bcryptjs";


async function main() {
  console.log("Seeding reference data...");

  // 1. Centers
  const hyderabad = await prisma.center.upsert({
    where: { code: "HYD" },
    update: { name: "Hyderabad Center", isActive: true },
    create: {
      name: "Hyderabad Center",
      code: "HYD"
    }
  });

  const bengaluru = await prisma.center.upsert({
    where: { code: "BLR" },
    update: { name: "Bengaluru Center", isActive: true },
    create: {
      name: "Bengaluru Center",
      code: "BLR"
    }
  });

  // 2. Labs
  const labs = [
    { centerId: hyderabad.id, name: "Hyderabad Lab 01", code: "HYD-LAB-01" },
    { centerId: hyderabad.id, name: "Hyderabad Lab 02", code: "HYD-LAB-02" },
    { centerId: bengaluru.id, name: "Bengaluru Lab 01", code: "BLR-LAB-01" }
  ];

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: {
        centerId_code: {
          centerId: lab.centerId,
          code: lab.code
        }
      },
      update: {
        name: lab.name,
        isActive: true
      },
      create: lab
    });
  }

  // 3. Categories
  const categories = [
    {
      name: "Software",
      code: "SOFTWARE",
      description: "Software installation, updates, removal, and licensing."
    },
    {
      name: "Hardware",
      code: "HARDWARE",
      description: "Computer and peripheral hardware issues."
    },
    {
      name: "Network",
      code: "NETWORK",
      description: "Connectivity and network-related issues."
    },
    {
      name: "Access",
      code: "ACCESS",
      description: "Account, permissions, and access requests."
    },
    {
      name: "Other",
      code: "OTHER",
      description: "Requests that do not fit another category."
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        description: category.description,
        isActive: true
      },
      create: category
    });
  }

  // 4. Software catalog
  const softwareCatalog = [
    { name: "Visual Studio Code", vendor: "Microsoft", version: null },
    { name: "Python", vendor: "Python Software Foundation", version: null },
    { name: "Node.js", vendor: "OpenJS Foundation", version: null }
  ];

  for (const software of softwareCatalog) {
    const existing = await prisma.software.findFirst({
      where: {
        name: software.name,
        vendor: software.vendor,
        version: software.version
      }
    });

    if (existing) {
      await prisma.software.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
    } else {
      await prisma.software.create({
        data: {
          ...software,
          licenseRequired: false
        }
      });
    }
  }

  // 5. Development SLA defaults (minutes)
  const slaPolicies = [
  {
    priority: "CRITICAL" as const,
    firstResponseMinutes: 15,
    resolutionMinutes: 240,
    atRiskThresholdPercent: 75
  },
  {
    priority: "HIGH" as const,
    firstResponseMinutes: 60,
    resolutionMinutes: 480,
    atRiskThresholdPercent: 75
  },
  {
    priority: "MEDIUM" as const,
    firstResponseMinutes: 240,
    resolutionMinutes: 1080,
    atRiskThresholdPercent: 75
  },
  {
    priority: "LOW" as const,
    firstResponseMinutes: 540,
    resolutionMinutes: 2700,
    atRiskThresholdPercent: 75
  }
];

  
  for (const policy of slaPolicies) {
  await prisma.slaPolicy.upsert({
    where: { priority: policy.priority },
    update: {
      firstResponseMinutes: policy.firstResponseMinutes,
      resolutionMinutes: policy.resolutionMinutes,
      atRiskThresholdPercent: policy.atRiskThresholdPercent,
      isActive: true
    },
    create: policy
  });
}

  console.log("Reference data seeded successfully.");

    // 6. Development users
  console.log("Seeding development users...");

  const developmentUsers = [
    {
      fullName: "Development Admin",
      email: "admin@gradious.local",
      passwordEnv: "DEV_ADMIN_PASSWORD",
      role: "ADMIN" as const,
      centerId: null
    },
    {
      fullName: "Development Employee",
      email: "employee@gradious.local",
      passwordEnv: "DEV_EMPLOYEE_PASSWORD",
      role: "EMPLOYEE" as const,
      centerId: hyderabad.id
    },
    {
      fullName: "Development Technician",
      email: "technician@gradious.local",
      passwordEnv: "DEV_TECHNICIAN_PASSWORD",
      role: "TECHNICIAN" as const,
      centerId: hyderabad.id
    },
    {
      fullName: "Development Center Manager",
      email: "manager@gradious.local",
      passwordEnv: "DEV_MANAGER_PASSWORD",
      role: "CENTER_MANAGER" as const,
      centerId: hyderabad.id
    }
  ];

  for (const user of developmentUsers) {
    const plainPassword = process.env[user.passwordEnv];

    if (!plainPassword) {
      throw new Error(
        `Missing required environment variable: ${user.passwordEnv}`
      );
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        passwordHash,
        role: user.role,
        isActive: true,
        centerId: user.centerId
      },
      create: {
        fullName: user.fullName,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
        centerId: user.centerId
      }
    });

        const seededUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
      select: { id: true }
    });

    if (user.centerId !== null) {
      await prisma.userCenter.upsert({
        where: {
          userId_centerId: {
            userId: seededUser.id,
            centerId: user.centerId
          }
        },
        update: {},
        create: {
          userId: seededUser.id,
          centerId: user.centerId
        }
      });
    }
  }

  console.log("Development users seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });