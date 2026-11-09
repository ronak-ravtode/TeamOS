import { PrismaClient, WorkspaceRole, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Team OS development database...');

  // Common password for all dev users
  const passwordHash = await bcrypt.hash('Password1234!', 10);

  // 1. Clean existing records
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users for Company Alpha
  const ownerAlpha = await prisma.user.create({
    data: {
      email: 'owner@alpha.test',
      name: 'Arthur Pendelton (Owner)',
      passwordHash,
    },
  });

  const adminAlpha = await prisma.user.create({
    data: {
      email: 'admin@alpha.test',
      name: 'Adeline Brooks (Admin)',
      passwordHash,
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@alpha.test',
      name: 'Alice Johnson',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@alpha.test',
      name: 'Bob Smith',
      passwordHash,
    },
  });

  // 3. Create Workspace: Company Alpha
  const companyAlpha = await prisma.workspace.create({
    data: {
      name: 'Company Alpha',
      slug: 'company-alpha',
      description: 'Alpha enterprise innovation and scalable cloud workspace',
    },
  });

  // 4. Assign Workspace Memberships for Alpha
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: companyAlpha.id, userId: ownerAlpha.id, role: WorkspaceRole.OWNER },
      { workspaceId: companyAlpha.id, userId: adminAlpha.id, role: WorkspaceRole.ADMIN },
      { workspaceId: companyAlpha.id, userId: alice.id, role: WorkspaceRole.MEMBER },
      { workspaceId: companyAlpha.id, userId: bob.id, role: WorkspaceRole.MEMBER },
    ],
  });

  // 5. Create Teams for Alpha
  const engTeam = await prisma.team.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Engineering',
      description: 'Application development, core architecture, and platform APIs',
      createdById: ownerAlpha.id,
    },
  });

  const prodTeam = await prisma.team.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Product',
      description: 'Product specifications, UX flows, and roadmap execution',
      createdById: adminAlpha.id,
    },
  });

  const mktgTeam = await prisma.team.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Marketing',
      description: 'Growth, content strategy, brand identity, and customer acquisition',
      createdById: adminAlpha.id,
    },
  });

  // Assign Team Members
  await prisma.teamMember.createMany({
    data: [
      { teamId: engTeam.id, userId: ownerAlpha.id },
      { teamId: engTeam.id, userId: alice.id },
      { teamId: engTeam.id, userId: bob.id },
      { teamId: prodTeam.id, userId: adminAlpha.id },
      { teamId: prodTeam.id, userId: alice.id },
      { teamId: mktgTeam.id, userId: bob.id },
    ],
  });

  // 6. Create Projects for Alpha
  const mobileProject = await prisma.project.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Mobile Application Launch',
      key: 'MOB',
      description: 'Native mobile client for iOS and Android with offline-first caching',
      teamId: engTeam.id,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-02-01'),
      targetDate: new Date('2026-08-30'),
      createdById: ownerAlpha.id,
    },
  });

  const webProject = await prisma.project.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Website Redesign',
      key: 'WEB',
      description: 'Next-generation marketing portal and customer onboarding experience',
      teamId: mktgTeam.id,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-06-15'),
      createdById: adminAlpha.id,
    },
  });

  const legacyProject = await prisma.project.create({
    data: {
      workspaceId: companyAlpha.id,
      name: 'Legacy Portal Migration',
      key: 'LEG',
      description: 'Decommissioned portal migration (archived)',
      teamId: engTeam.id,
      status: ProjectStatus.ARCHIVED,
      startDate: new Date('2025-01-01'),
      targetDate: new Date('2025-12-31'),
      createdById: ownerAlpha.id,
    },
  });

  // 7. Create Tasks for Alpha
  const task1 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: mobileProject.id,
      taskNumber: 1,
      title: 'Design biometric authentication flow',
      description: 'Implement FaceID and fingerprint biometric unlock for iOS/Android',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeId: alice.id,
      creatorId: ownerAlpha.id,
      startDate: new Date('2026-02-05'),
      dueDate: new Date('2026-02-28'),
      position: 1000,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: mobileProject.id,
      taskNumber: 2,
      title: 'Setup offline SQLite sync engine',
      description: 'Local relational caching using SQLite with conflict resolution',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      assigneeId: bob.id,
      creatorId: ownerAlpha.id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-05-15'),
      position: 2000,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: mobileProject.id,
      taskNumber: 3,
      title: 'Fix push notification payload parsing bug',
      description: 'Deep link paths fail when payload exceeds 2KB',
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.HIGH,
      assigneeId: alice.id,
      creatorId: adminAlpha.id,
      startDate: new Date('2026-03-10'),
      dueDate: new Date('2026-03-25'), // Overdue!
      position: 3000,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: mobileProject.id,
      taskNumber: 4,
      title: 'Implement push notification action buttons',
      description: 'Quick approvals right from OS notification shade',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: bob.id,
      creatorId: alice.id,
      startDate: new Date('2026-04-01'),
      dueDate: new Date('2026-06-01'),
      position: 4000,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: mobileProject.id,
      taskNumber: 5,
      title: 'Prepare App Store screenshots and compliance review',
      description: 'Generate high-res device frames for Apple App Store and Google Play',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      creatorId: ownerAlpha.id,
      position: 5000,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: webProject.id,
      taskNumber: 1,
      title: 'Implement Tailwind design tokens and typography',
      description: 'Brand color palette, typography scale, and dark mode tokens',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeId: bob.id,
      creatorId: adminAlpha.id,
      startDate: new Date('2026-03-05'),
      dueDate: new Date('2026-03-20'),
      position: 1000,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      workspaceId: companyAlpha.id,
      projectId: webProject.id,
      taskNumber: 2,
      title: 'Audit accessibility (WCAG 2.1 AA compliance)',
      description: 'Ensure color contrast and screen reader landmarks conform to AA standard',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeId: alice.id,
      creatorId: adminAlpha.id,
      startDate: new Date('2026-03-15'),
      dueDate: new Date('2026-04-01'), // Overdue!
      position: 2000,
    },
  });

  // 8. Create Comments on Task 2 and Task 3
  await prisma.taskComment.createMany({
    data: [
      {
        workspaceId: companyAlpha.id,
        taskId: task2.id,
        authorId: ownerAlpha.id,
        content: 'Please ensure transaction rollback handles disk quota exceptions.',
        createdAt: new Date('2026-03-02T10:00:00Z'),
      },
      {
        workspaceId: companyAlpha.id,
        taskId: task2.id,
        authorId: bob.id,
        content: 'Added integration tests covering storage limits and recovery.',
        createdAt: new Date('2026-03-03T14:30:00Z'),
      },
      {
        workspaceId: companyAlpha.id,
        taskId: task3.id,
        authorId: alice.id,
        content: 'Currently blocked waiting on APNS certificate renewal from Apple Dev portal.',
        createdAt: new Date('2026-03-12T09:15:00Z'),
      },
    ],
  });

  // ==========================================
  // 9. ISOLATED SECOND TENANT: Company Beta
  // ==========================================
  const ownerBeta = await prisma.user.create({
    data: {
      email: 'david@beta.test',
      name: 'David Miller (Beta Owner)',
      passwordHash,
    },
  });

  const emmaBeta = await prisma.user.create({
    data: {
      email: 'emma@beta.test',
      name: 'Emma Watson (Beta Admin)',
      passwordHash,
    },
  });

  const frankBeta = await prisma.user.create({
    data: {
      email: 'frank@beta.test',
      name: 'Frank Castle (Beta Member)',
      passwordHash,
    },
  });

  const companyBeta = await prisma.workspace.create({
    data: {
      name: 'Company Beta',
      slug: 'company-beta',
      description: 'Beta analytics and deep learning research laboratory',
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: companyBeta.id, userId: ownerBeta.id, role: WorkspaceRole.OWNER },
      { workspaceId: companyBeta.id, userId: emmaBeta.id, role: WorkspaceRole.ADMIN },
      { workspaceId: companyBeta.id, userId: frankBeta.id, role: WorkspaceRole.MEMBER },
    ],
  });

  const betaEngTeam = await prisma.team.create({
    data: {
      workspaceId: companyBeta.id,
      name: 'Data Science & AI',
      description: 'Model training pipelines and inference optimization',
      createdById: ownerBeta.id,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: betaEngTeam.id, userId: ownerBeta.id },
      { teamId: betaEngTeam.id, userId: frankBeta.id },
    ],
  });

  const betaProject = await prisma.project.create({
    data: {
      workspaceId: companyBeta.id,
      name: 'Autonomous Agent Fleet',
      key: 'AUT',
      description: 'Distributed model serving across heterogeneous GPU clusters',
      teamId: betaEngTeam.id,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-01-15'),
      targetDate: new Date('2026-11-30'),
      createdById: ownerBeta.id,
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: companyBeta.id,
      projectId: betaProject.id,
      taskNumber: 1,
      title: 'CUDA kernel optimization for flash attention',
      description: 'Reduce memory footprint on H100 SXM5 instances',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      assigneeId: frankBeta.id,
      creatorId: ownerBeta.id,
      position: 1000,
    },
  });

  console.log('Database successfully seeded with Company Alpha and Company Beta!');
  console.log('Seed users test credentials:');
  console.log('  Password for all accounts: Password1234!');
  console.log('  Company Alpha: owner@alpha.test, admin@alpha.test, alice@alpha.test, bob@alpha.test');
  console.log('  Company Beta:  david@beta.test, emma@beta.test, frank@beta.test');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

