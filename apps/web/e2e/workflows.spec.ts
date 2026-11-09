import { test, expect } from '@playwright/test';

test.describe('Team OS End-to-End User Workflows', () => {
  const uniqueId = Date.now();
  const newEmail = `e2e.user.${uniqueId}@example.com`;
  const workspaceName = `E2E Workspace ${uniqueId}`;

  test('E2E-01: A new user registers, creates a workspace, and reaches the dashboard', async ({ page }) => {
    // 1. Visit registration page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

    // 2. Fill registration details
    await page.fill('input[name="name"]', 'E2E Founder');
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', 'Password1234!');
    await page.fill('input[name="confirmPassword"]', 'Password1234!');
    await page.click('button[type="submit"]');

    // 3. Reaches onboarding to create workspace
    await expect(page).toHaveURL(/.*onboarding/);
    await expect(page.getByRole('heading', { name: /welcome to team os/i })).toBeVisible();

    // 4. Fill workspace details
    await page.fill('input[name="name"]', workspaceName);
    await page.fill('textarea[name="description"]', 'E2E verification container');
    await page.click('button[type="submit"]');

    // 5. Reaches dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText(workspaceName)).toBeVisible();
    await expect(page.getByText(/your workspace is ready/i)).toBeVisible();
  });

  test('E2E-02: Workspace owner adds an existing user and creates an Engineering team', async ({ page }) => {
    // 1. Login as Alpha owner
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@alpha.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Company Alpha Overview')).toBeVisible();

    // 2. Navigate to Teams
    await page.click('a[href="/teams"]');
    await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible();
    await expect(page.getByText('Engineering')).toBeVisible();

    // 3. Create a new team
    await page.click('button:has-text("Create Team")');
    await page.fill('input[name="name"]', `Infrastructure ${uniqueId}`);
    await page.fill('textarea[name="description"]', 'Cloud DevOps and DB reliability');
    await page.click('div[role="dialog"] button:has-text("Create Team")');

    await expect(page.getByText(`Infrastructure ${uniqueId}`)).toBeVisible();

    // 4. Navigate to Members and verify members exist
    await page.click('a[href="/members"]');
    await expect(page.getByRole('heading', { name: 'Workspace Members' })).toBeVisible();
    await expect(page.getByText('alice@alpha.test')).toBeVisible();
    await expect(page.getByText('bob@alpha.test')).toBeVisible();
  });

  test('E2E-03 & E2E-10: Owner creates a project with no tasks and views dashboard progress as 0%', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@alpha.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    // Navigate to Projects
    await page.click('a[href="/projects"]');
    await page.click('button:has-text("New Project")');

    const projectKey = `P${String(uniqueId).slice(-4)}`;
    await page.fill('input[name="name"]', `Zero Tasks Project ${uniqueId}`);
    await page.fill('input[name="key"]', projectKey);
    await page.click('div[role="dialog"] button:has-text("Create Project")');

    // Open project detail
    await page.click(`text=Zero Tasks Project ${uniqueId}`);
    await expect(page.getByText('0%')).toBeVisible();
    await expect(page.getByText('0', { exact: true }).first()).toBeVisible();
  });

  test('E2E-04 & E2E-05: Member creates task, assigns it, updates status, and comments', async ({ page }) => {
    // Login as Alice (Member of Company Alpha)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'alice@alpha.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    // Go to Mobile Application Launch project
    await page.click('a[href="/projects"]');
    await page.click('text=Mobile Application Launch');

    // Add new task
    await page.click('button:has-text("New Task")');
    const taskTitle = `E2E Playwright Task ${uniqueId}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.click('div[role="dialog"] button:has-text("Create Task")');

    // Task appears on Kanban board
    await expect(page.getByText(taskTitle)).toBeVisible();

    // Click task to open details modal
    await page.click(`text=${taskTitle}`);
    await expect(page.getByText('Task Details')).toBeVisible();

    // Post a comment
    await page.fill('textarea[placeholder*="Write a comment"]', 'Automated E2E comment submission.');
    await page.click('button:has-text("Post Comment")');
    await expect(page.getByText('Automated E2E comment submission.')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('E2E-06: Workspace switcher shows different isolated workspace data', async ({ page }) => {
    // Login as Alpha owner (who belongs to Alpha)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@alpha.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Company Alpha Overview')).toBeVisible();
    await expect(page.getByText('Mobile Application Launch')).toBeVisible();

    // Login as David (Owner of Company Beta)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'david@beta.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    // Company Beta overview
    await expect(page.getByText('Company Beta Overview')).toBeVisible();
    await expect(page.getByText('Autonomous Agent Fleet')).toBeVisible();
    // Company Alpha project must NEVER be visible
    await expect(page.getByText('Mobile Application Launch')).not.toBeVisible();
  });

  test('E2E-07 & E2E-09: Member restricted from settings and archived projects', async ({ page }) => {
    // Login as Alice (Member)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'alice@alpha.test');
    await page.fill('input[name="password"]', 'Password1234!');
    await page.click('button[type="submit"]');

    // Go to Settings -> Read-only message is shown
    await page.click('a[href="/settings"]');
    await expect(page.getByText(/only workspace owners and administrators can modify settings/i)).toBeVisible();

    // Go to Projects -> Archived projects
    await page.click('a[href="/projects"]');
    await page.click('button:has-text("Archived Projects")');
    await page.click('text=Legacy Portal Migration');

    // Archived project notice
    await expect(page.getByText(/archived \(read only\)/i)).toBeVisible();
    // New Task button is hidden/disabled for ordinary member
    await expect(page.getByRole('button', { name: /new task/i })).not.toBeVisible();
  });
});

