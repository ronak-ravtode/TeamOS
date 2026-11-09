import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db/prisma';
import { WorkspaceRole, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';

describe('Team OS API — Milestone 1 E2E Integration Suite', () => {
  jest.setTimeout(30000);

  let ownerToken: string;
  let ownerUserId: string;
  let workspaceAlphaId: string;

  let adminToken: string;
  let adminUserId: string;

  let memberToken: string;
  let memberUserId: string;

  let workspaceBetaId: string;
  let betaOwnerToken: string;

  let projectId: string;
  let taskId: string;
  let commentId: string;
  let teamId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Feature Module 1: User Authentication', () => {
    const testEmail = `test.owner.${Date.now()}@example.com`;

    it('AUTH-01: should register a new account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Owner',
          email: testEmail,
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.accessToken).toBeDefined();

      ownerToken = res.body.accessToken;
      ownerUserId = res.body.user.id;
    });

    it('AUTH-02: should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail,
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('AUTH-03: should reject invalid email format with 400 Bad Request', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(400);
    });

    it('AUTH-04: should reject password below minimum length (12 chars)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: `shortpass.${Date.now()}@example.com`,
          password: 'Short1!',
          confirmPassword: 'Short1!',
        })
        .expect(400);
    });

    it('AUTH-05: should login with valid credentials and return access token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password1234!',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.id).toBe(ownerUserId);
    });

    it('AUTH-06: should reject login with incorrect password with 401 Unauthorized', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('AUTH-07: should reject unauthenticated access with 401', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    // Create additional test users: Admin, Member, and Beta Owner
    it('Setup: register admin and member accounts', async () => {
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Admin',
          email: `admin.${Date.now()}@example.com`,
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(201);
      adminToken = adminRes.body.accessToken;
      adminUserId = adminRes.body.user.id;

      const memberRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Member',
          email: `member.${Date.now()}@example.com`,
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(201);
      memberToken = memberRes.body.accessToken;
      memberUserId = memberRes.body.user.id;

      const betaRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Beta Owner',
          email: `beta.owner.${Date.now()}@example.com`,
          password: 'Password1234!',
          confirmPassword: 'Password1234!',
        })
        .expect(201);
      betaOwnerToken = betaRes.body.accessToken;
    });
  });

  describe('Feature Module 2: Workspace Management & Multi-Tenancy', () => {
    it('WORKSPACE-01: should create a workspace and make creator OWNER', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Integration Workspace Alpha',
          description: 'Alpha workspace for E2E tests',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.role).toBe(WorkspaceRole.OWNER);
      workspaceAlphaId = res.body.id;
    });

    it('WORKSPACE-02: should allow creating a second workspace under same user', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Integration Workspace Secondary',
        })
        .expect(201);

      const listRes = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(listRes.body.length).toBeGreaterThanOrEqual(2);
    });

    it('Setup: create isolated Workspace Beta under Beta Owner', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${betaOwnerToken}`)
        .send({
          name: 'Integration Workspace Beta',
        })
        .expect(201);
      workspaceBetaId = res.body.id;
    });

    it('WORKSPACE-04: should deny cross-workspace access with 403 Forbidden', async () => {
      // Owner of Alpha attempts to access Workspace Beta
      await request(app)
        .get(`/api/workspaces/${workspaceBetaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);
    });
  });

  describe('Feature Module 3: Workspace Members & RBAC', () => {
    let memberId: string;

    it('RBAC-01: Owner adds registered user to workspace', async () => {
      const memberUserRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${memberToken}`);

      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: memberUserRes.body.email,
          role: WorkspaceRole.MEMBER,
        })
        .expect(201);

      expect(res.body.role).toBe(WorkspaceRole.MEMBER);
      memberId = res.body.id;
    });

    it('RBAC-06: Reject duplicate workspace membership with 409 Conflict', async () => {
      const memberUserRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${memberToken}`);

      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: memberUserRes.body.email,
          role: WorkspaceRole.MEMBER,
        })
        .expect(409);
    });

    it('Setup: Add admin to workspace Alpha', async () => {
      const adminUserRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: adminUserRes.body.email,
          role: WorkspaceRole.ADMIN,
        })
        .expect(201);
    });

    it('RBAC-02: Owner changes member role into ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/members/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: WorkspaceRole.ADMIN })
        .expect(200);

      expect(res.body.role).toBe(WorkspaceRole.ADMIN);

      // Revert back to MEMBER
      await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/members/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: WorkspaceRole.MEMBER })
        .expect(200);
    });

    it('RBAC-03: Member attempts to add another user -> 403 Forbidden', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          email: 'random@example.com',
          role: WorkspaceRole.MEMBER,
        })
        .expect(403);
    });

    it('RBAC-04: Member attempts to update workspace settings -> 403 Forbidden', async () => {
      await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Hacked Workspace Name' })
        .expect(403);
    });

    it('RBAC-05: Admin attempts to remove the OWNER -> 403 Forbidden', async () => {
      const membersRes = await request(app)
        .get(`/api/workspaces/${workspaceAlphaId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const ownerMember = membersRes.body.find((m: any) => m.role === WorkspaceRole.OWNER);

      await request(app)
        .delete(`/api/workspaces/${workspaceAlphaId}/members/${ownerMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('Feature Module 4: Team Management', () => {
    it('TEAM-01: Owner creates Engineering team', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/teams`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Core Engineering',
          description: 'Platform infrastructure and backend microservices',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Core Engineering');
      teamId = res.body.id;
    });

    it('TEAM-02: Owner adds workspace member to team', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberUserId })
        .expect(201);

      expect(res.body.userId).toBe(memberUserId);
    });

    it('TEAM-03: Attempt to add external workspace user -> 400 Bad Request', async () => {
      // User from Workspace Beta
      const betaUserRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${betaOwnerToken}`);

      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: betaUserRes.body.id })
        .expect(400);
    });

    it('TEAM-04: Add the same user twice to team -> 409 Conflict', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberUserId })
        .expect(409);
    });

    it('TEAM-05: Member attempts to create a team -> 403 Forbidden', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/teams`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Unauthorized Team' })
        .expect(403);
    });
  });

  describe('Feature Module 5: Project Management', () => {
    it('PROJECT-01: Create a new project with valid details', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Mobile Core Redesign',
          key: 'MCR',
          description: 'New Flutter and native mobile architecture',
          teamId,
          startDate: '2026-05-01',
          targetDate: '2026-10-31',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.key).toBe('MCR');
      expect(res.body.progressPercentage).toBe(0);
      projectId = res.body.id;
    });

    it('PROJECT-02: Create two projects with same key in one workspace -> 409 Conflict', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Duplicate Key Project',
          key: 'MCR',
        })
        .expect(409);
    });

    it('PROJECT-03: Create project with same key in different workspace -> 201 Allowed', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceBetaId}/projects`)
        .set('Authorization', `Bearer ${betaOwnerToken}`)
        .send({
          name: 'Beta Project With Same Key',
          key: 'MCR',
        })
        .expect(201);
    });

    it('PROJECT-04: Create project referencing team from different workspace -> 400 Bad Request', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceBetaId}/projects`)
        .set('Authorization', `Bearer ${betaOwnerToken}`)
        .send({
          name: 'Cross Team Project',
          key: 'CTP',
          teamId, // Belongs to Alpha!
        })
        .expect(400);
    });

    it('PROJECT-05: Set start date after target completion date -> 400 Bad Request', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Backwards Project',
          key: 'BWD',
          startDate: '2026-12-01',
          targetDate: '2026-06-01',
        })
        .expect(400);
    });
  });

  describe('Feature Module 6: Task Management', () => {
    it('TASK-01: Create a task with valid title and project', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Setup automated CI test harness',
          description: 'Add Jest, Vitest, and Playwright workflows',
          projectId,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Setup automated CI test harness');
      expect(res.body.formattedKey).toBe('MCR-1');
      taskId = res.body.id;
    });

    it('TASK-02: Create a task without a title -> 400 Bad Request', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: '',
          projectId,
        })
        .expect(400);
    });

    it('TASK-03: Assign task to a valid workspace member', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          assigneeId: memberUserId,
        })
        .expect(200);

      expect(res.body.assigneeId).toBe(memberUserId);
    });

    it('TASK-04: Assign task to user outside workspace -> 400 Bad Request', async () => {
      const betaUserRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${betaOwnerToken}`);

      await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          assigneeId: betaUserRes.body.id,
        })
        .expect(400);
    });

    it('TASK-05: Change task status from TODO to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('TASK-06: Set task priority to URGENT', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          priority: TaskPriority.URGENT,
        })
        .expect(200);

      expect(res.body.priority).toBe(TaskPriority.URGENT);
    });

    it('TASK-07: Filter tasks by IN_PROGRESS status', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceAlphaId}/tasks?status=IN_PROGRESS`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.every((t: any) => t.status === TaskStatus.IN_PROGRESS)).toBe(true);
    });

    it('TASK-08: Search tasks by title', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceAlphaId}/tasks?search=CI%20test`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toContain('CI test');
    });

    it('TASK-11: Attempt invalid status value -> 400 Bad Request', async () => {
      await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'INVALID_STATUS_VALUE',
        })
        .expect(400);
    });

    it('TASK-12: Update task belonging to another workspace -> 403 Forbidden', async () => {
      await request(app)
        .patch(`/api/workspaces/${workspaceBetaId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${betaOwnerToken}`)
        .send({ title: 'Cross Workspace Exploit' })
        .expect(404);
    });
  });

  describe('Feature Module 7: Task Comments', () => {
    it('COMMENT-01: Member creates a comment on a valid task', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Initial integration tests have been committed.',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe('Initial integration tests have been committed.');
      commentId = res.body.id;
    });

    it('COMMENT-02: Submit an empty comment -> 400 Bad Request', async () => {
      await request(app)
        .post(`/api/workspaces/${workspaceAlphaId}/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: '   ' })
        .expect(400);
    });

    it('COMMENT-03: User edits their own comment', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ content: 'Edited: All tests passing with 100% coverage.' })
        .expect(200);

      expect(res.body.content).toContain('Edited:');
    });

    it('COMMENT-04: User tries to edit another member comment -> 403 Forbidden', async () => {
      await request(app)
        .patch(`/api/workspaces/${workspaceAlphaId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Malicious edit by another user' })
        .expect(403);
    });

    it('COMMENT-06: Attempt to access comment across workspace -> 403/404 Forbidden', async () => {
      await request(app)
        .patch(`/api/workspaces/${workspaceBetaId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${betaOwnerToken}`)
        .send({ content: 'Cross workspace comment edit' })
        .expect(404);
    });

    it('COMMENT-05: Admin deletes a comment', async () => {
      await request(app)
        .delete(`/api/workspaces/${workspaceAlphaId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Feature Module 8: Dashboard & Metrics', () => {
    it('DASH-01: Aggregated workspace metrics accurately reflect database records', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceAlphaId}/dashboard`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.totalActiveProjects).toBeGreaterThanOrEqual(1);
      expect(res.body.totalTasks).toBeGreaterThanOrEqual(1);
      expect(res.body.inProgressTasks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.recentProjects)).toBe(true);
      expect(Array.isArray(res.body.myAssignedTasks)).toBe(true);
    });
  });
});

