// Comprehensive Milestone 1 Verification Script
// Tests all endpoints against the live running server at http://localhost:4000/api

const BASE_URL = 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING TEAM OS MILESTONE 1 FULL FEATURE AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const ownerEmail = `audit.owner.${timestamp}@example.com`;
  const memberEmail = `audit.member.${timestamp}@example.com`;
  const inviteeEmail = `audit.invitee.${timestamp}@example.com`;
  const betaEmail = `audit.beta.${timestamp}@example.com`;

  let ownerToken = '';
  let memberToken = '';
  let betaToken = '';
  let workspaceId = '';
  let betaWorkspaceId = '';
  let teamId = '';
  let projectId = '';
  let taskId = '';
  let commentId = '';
  let memberUserId = '';

  // ----------------------------------------------------
  // MODULE 1: AUTHENTICATION
  // ----------------------------------------------------
  console.log('--- 1. Testing Authentication ---');
  
  // 1.1 Register Owner
  const regOwner = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Audit Owner',
      email: ownerEmail,
      password: 'Password1234!',
      confirmPassword: 'Password1234!',
    }),
  });
  assert(regOwner.status === 201 && regOwner.data.accessToken, 'Register company owner');
  ownerToken = regOwner.data.accessToken;

  // 1.2 Register Member
  const regMember = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Audit Member',
      email: memberEmail,
      password: 'Password1234!',
      confirmPassword: 'Password1234!',
    }),
  });
  assert(regMember.status === 201 && regMember.data.accessToken, 'Register team member');
  memberToken = regMember.data.accessToken;
  memberUserId = regMember.data.user.id;

  // 1.3 Reject short password
  const shortPass = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bad Password',
      email: `bad.${timestamp}@example.com`,
      password: 'short',
      confirmPassword: 'short',
    }),
  });
  assert(shortPass.status === 400, 'Reject password < 12 characters');

  // 1.4 Reject duplicate email
  const dupEmail = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate',
      email: ownerEmail,
      password: 'Password1234!',
      confirmPassword: 'Password1234!',
    }),
  });
  assert(dupEmail.status === 409, 'Reject duplicate email registration');

  // 1.5 Login valid
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ownerEmail,
      password: 'Password1234!',
    }),
  });
  assert(loginRes.status === 200 && loginRes.data.user.email === ownerEmail, 'Login with valid credentials');

  // 1.6 Login invalid
  const loginBad = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ownerEmail,
      password: 'WrongPassword!',
    }),
  });
  assert(loginBad.status === 401, 'Reject login with invalid password');

  // 1.7 Refresh token
  const refreshRes = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: loginRes.data.refreshToken,
    }),
  });
  assert(refreshRes.status === 200 && refreshRes.data.accessToken, 'Rotate and return new JWT access token');

  // 1.8 Profile update
  const profileRes = await request('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: 'Arthur P. Owner (Updated)',
    }),
  });
  assert(profileRes.status === 200 && profileRes.data.name.includes('Updated'), 'Update user profile');

  // ----------------------------------------------------
  // MODULE 2: WORKSPACES & ONBOARDING
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Workspaces & Onboarding ---');

  // 2.1 Create Workspace Alpha
  const wsRes = await request('/workspaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: `Audit Alpha Org ${timestamp}`,
      description: 'Audit test company workspace',
    }),
  });
  assert(wsRes.status === 201 && wsRes.data.id, 'Create primary company workspace');
  workspaceId = wsRes.data.id;

  // 2.2 List user workspaces
  const listWs = await request('/workspaces', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(listWs.status === 200 && listWs.data.some((w) => w.id === workspaceId), 'List user workspaces');

  // 2.3 Member has 0 workspaces before invitation
  const memberWsPre = await request('/workspaces', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(memberWsPre.status === 200 && memberWsPre.data.length === 0, 'New member starts with 0 workspaces (directed to Member Waiting Room)');

  // ----------------------------------------------------
  // MODULE 3: MEMBERSHIP & DIRECT INVITATION
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Members & Auto-Provisioning ---');

  // 3.1 Add registered member to workspace
  const addMemberRes = await request(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      email: memberEmail,
      role: 'MEMBER',
    }),
  });
  assert(addMemberRes.status === 201, 'Add registered team member to workspace');

  // 3.2 Add UNREGISTERED email (Auto-Provisioning feature)
  const addUnregistered = await request(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      email: inviteeEmail,
      name: 'Direct Invitee',
      role: 'MEMBER',
    }),
  });
  assert(addUnregistered.status === 201, 'Add unregistered email directly (auto-provisions member account without 404!)');

  // 3.3 Verify auto-provisioned member can immediately log in
  const inviteeLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: inviteeEmail,
      password: 'Password1234!',
    }),
  });
  assert(inviteeLogin.status === 200 && inviteeLogin.data.accessToken, 'Auto-provisioned invitee can log in with default credentials');

  // 3.4 Invitee immediately has workspace access (no onboarding required!)
  const inviteeWs = await request('/workspaces', {
    headers: { Authorization: `Bearer ${inviteeLogin.data.accessToken}` },
  });
  assert(inviteeWs.status === 200 && inviteeWs.data.length === 1, 'Auto-provisioned invitee enters workspace directly without onboarding');

  // 3.5 Member now has 1 workspace
  const memberWsPost = await request('/workspaces', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(memberWsPost.status === 200 && memberWsPost.data.length === 1, 'Added member now has access to workspace');

  // 3.6 List workspace members
  const membersList = await request(`/workspaces/${workspaceId}/members`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(membersList.status === 200 && membersList.data.length >= 3, 'List all workspace members');

  // ----------------------------------------------------
  // MODULE 4: TEAMS MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Teams ---');

  // 4.1 Create Team
  const teamRes = await request(`/workspaces/${workspaceId}/teams`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      name: 'Product Engineering',
      description: 'Core backend and web interfaces',
    }),
  });
  assert(teamRes.status === 201 && teamRes.data.id, 'Create team in workspace');
  teamId = teamRes.data.id;

  // 4.2 Add member to team
  const addTeamMember = await request(`/workspaces/${workspaceId}/teams/${teamId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      userId: memberUserId,
    }),
  });
  assert(addTeamMember.status === 201, 'Assign member to team');

  // 4.3 List teams
  const listTeams = await request(`/workspaces/${workspaceId}/teams`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(listTeams.status === 200 && listTeams.data.length > 0, 'List workspace teams');

  // ----------------------------------------------------
  // MODULE 5: PROJECTS MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Projects ---');

  // 5.1 Create Project
  const projRes = await request(`/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      name: 'AI Operating System Core',
      description: 'Milestone 1 workspace foundation and state graph',
      teamId: teamId,
    }),
  });
  assert(projRes.status === 201 && projRes.data.id, 'Create project linked to team');
  projectId = projRes.data.id;

  // 5.2 List projects
  const listProj = await request(`/workspaces/${workspaceId}/projects`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(listProj.status === 200 && listProj.data.length > 0, 'List workspace projects');

  // ----------------------------------------------------
  // MODULE 6: TASKS & PROGRESS
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Tasks ---');

  // 6.1 Create Task
  const taskRes = await request(`/workspaces/${workspaceId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      projectId: projectId,
      title: 'Architect Tenant Scoped Database Models',
      description: 'Ensure all tenant records have explicit workspace foreign keys',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: memberUserId,
    }),
  });
  assert(taskRes.status === 201 && taskRes.data.id, 'Create task with priority and assignee');
  taskId = taskRes.data.id;

  // 6.2 Update task status (Member can update status)
  const updateTask = await request(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      status: 'IN_PROGRESS',
    }),
  });
  assert(updateTask.status === 200 && updateTask.data.status === 'IN_PROGRESS', 'Member updates task status to IN_PROGRESS');

  // 6.3 List tasks with filter
  const tasksFiltered = await request(`/workspaces/${workspaceId}/tasks?status=IN_PROGRESS`, {
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(tasksFiltered.status === 200 && tasksFiltered.data.some((t) => t.id === taskId), 'Filter tasks by status');

  // ----------------------------------------------------
  // MODULE 7: TASK COMMENTS
  // ----------------------------------------------------
  console.log('\n--- 7. Testing Task Comments ---');

  // 7.1 Add comment as member
  const commentRes = await request(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({
      content: 'Investigation started on Supabase IPv4 connection pooler.',
    }),
  });
  assert(commentRes.status === 201 && commentRes.data.id, 'Add comment to task');
  commentId = commentRes.data.id;

  // 7.2 List comments
  const listComments = await request(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(listComments.status === 200 && listComments.data.length > 0, 'List task comments');

  // ----------------------------------------------------
  // MODULE 8: DASHBOARD METRICS
  // ----------------------------------------------------
  console.log('\n--- 8. Testing Dashboard ---');

  const dashRes = await request(`/workspaces/${workspaceId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(
    dashRes.status === 200 &&
    dashRes.data.totalActiveProjects >= 1 &&
    dashRes.data.totalTasks >= 1,
    'Workspace dashboard statistics aggregation'
  );

  // ----------------------------------------------------
  // MODULE 9: MULTI-TENANT ISOLATION
  // ----------------------------------------------------
  console.log('\n--- 9. Testing Strict Multi-Tenant Isolation ---');

  // 9.1 Register Beta Owner & Create Beta Workspace
  const regBeta = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Beta Owner',
      email: betaEmail,
      password: 'Password1234!',
      confirmPassword: 'Password1234!',
    }),
  });
  betaToken = regBeta.data.accessToken;

  const betaWs = await request('/workspaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${betaToken}` },
    body: JSON.stringify({
      name: `Audit Beta Corp ${timestamp}`,
    }),
  });
  betaWorkspaceId = betaWs.data.id;

  // 9.2 Beta user attempts to access Workspace Alpha's projects
  const crossTenantProj = await request(`/workspaces/${workspaceId}/projects`, {
    headers: {
      Authorization: `Bearer ${betaToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(
    crossTenantProj.status === 403 || crossTenantProj.status === 404,
    `Cross-tenant project access rejected with status ${crossTenantProj.status}`
  );

  // 9.3 Beta user attempts to access Workspace Alpha's task directly
  const crossTenantTask = await request(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${betaToken}`,
      'x-workspace-id': workspaceId,
    },
  });
  assert(
    crossTenantTask.status === 403 || crossTenantTask.status === 404,
    `Cross-tenant task access rejected with status ${crossTenantTask.status}`
  );

  // 9.4 Beta user attempts to add comment to Workspace Alpha's task
  const crossTenantComment = await request(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${betaToken}`,
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({ content: 'Malicious cross-tenant injection' }),
  });
  assert(
    crossTenantComment.status === 403 || crossTenantComment.status === 404,
    `Cross-tenant comment creation rejected with status ${crossTenantComment.status}`
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
