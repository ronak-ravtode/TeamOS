# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflows.spec.ts >> Team OS End-to-End User Workflows >> E2E-01: A new user registers, creates a workspace, and reaches the dashboard
- Location: e2e\workflows.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /create your account/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /create your account/i }) with timeout 10000ms
  - waiting for getByRole('heading', { name: /create your account/i })

```

```yaml
- banner:
  - link "JanSahay logo JanSahay":
    - /url: /
    - img "JanSahay logo"
    - text: JanSahay
  - navigation "Primary":
    - link "Schemes":
      - /url: /schemes
    - link "Services":
      - /url: /services
    - link "Legal":
      - /url: /legal
    - link "Grievance":
      - /url: /grievance
  - link "FAQ":
    - /url: /faq
  - button "Change language":
    - text: EN
    - img
  - link "Chat":
    - /url: /chat
  - button "⚡ Guest Access"
  - link "Sign In":
    - /url: /sign-in
- main:
  - link "Skip to content":
    - /url: "#content"
  - paragraph: "404"
  - heading "This page does not exist" [level=1]
  - paragraph: The link you followed may be broken, or the page may have moved.
  - link "Back to home":
    - /url: /
    - button "Back to home"
- contentinfo:
  - link "JanSahay logo JanSahay":
    - /url: /
    - img "JanSahay logo"
    - text: JanSahay
  - paragraph: Government assistance for Indian cooperatives.
  - heading "Schemes & Services" [level=3]
  - list:
    - listitem:
      - link "Schemes":
        - /url: /schemes
    - listitem:
      - link "Services":
        - /url: /services
  - heading "Legal & Support" [level=3]
  - list:
    - listitem:
      - link "Legal":
        - /url: /legal
    - listitem:
      - link "FAQ":
        - /url: /faq
    - listitem:
      - link "Grievance":
        - /url: /grievance
  - heading "Contact" [level=3]
  - list:
    - listitem:
      - link "Chat":
        - /url: /chat
    - listitem: support@jansahay.gov.in
    - listitem: 1800-XXX-XXXX (Toll free)
  - text: © 2026 JanSahay. Built for Indian cooperatives.
- button "Open chat":
  - img "JanSahay Assistant"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Team OS End-to-End User Workflows', () => {
  4   |   const uniqueId = Date.now();
  5   |   const newEmail = `e2e.user.${uniqueId}@example.com`;
  6   |   const workspaceName = `E2E Workspace ${uniqueId}`;
  7   | 
  8   |   test('E2E-01: A new user registers, creates a workspace, and reaches the dashboard', async ({ page }) => {
  9   |     // 1. Visit registration page
  10  |     await page.goto('/register');
> 11  |     await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
      |                                                                               ^ Error: expect(locator).toBeVisible() failed
  12  | 
  13  |     // 2. Fill registration details
  14  |     await page.fill('input[name="name"]', 'E2E Founder');
  15  |     await page.fill('input[name="email"]', newEmail);
  16  |     await page.fill('input[name="password"]', 'Password1234!');
  17  |     await page.fill('input[name="confirmPassword"]', 'Password1234!');
  18  |     await page.click('button[type="submit"]');
  19  | 
  20  |     // 3. Reaches onboarding to create workspace
  21  |     await expect(page).toHaveURL(/.*onboarding/);
  22  |     await expect(page.getByRole('heading', { name: /welcome to team os/i })).toBeVisible();
  23  | 
  24  |     // 4. Fill workspace details
  25  |     await page.fill('input[name="name"]', workspaceName);
  26  |     await page.fill('textarea[name="description"]', 'E2E verification container');
  27  |     await page.click('button[type="submit"]');
  28  | 
  29  |     // 5. Reaches dashboard
  30  |     await expect(page).toHaveURL('/');
  31  |     await expect(page.getByText(workspaceName)).toBeVisible();
  32  |     await expect(page.getByText(/your workspace is ready/i)).toBeVisible();
  33  |   });
  34  | 
  35  |   test('E2E-02: Workspace owner adds an existing user and creates an Engineering team', async ({ page }) => {
  36  |     // 1. Login as Alpha owner
  37  |     await page.goto('/login');
  38  |     await page.fill('input[name="email"]', 'owner@alpha.test');
  39  |     await page.fill('input[name="password"]', 'Password1234!');
  40  |     await page.click('button[type="submit"]');
  41  | 
  42  |     await expect(page).toHaveURL('/');
  43  |     await expect(page.getByText('Company Alpha Overview')).toBeVisible();
  44  | 
  45  |     // 2. Navigate to Teams
  46  |     await page.click('a[href="/teams"]');
  47  |     await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible();
  48  |     await expect(page.getByText('Engineering')).toBeVisible();
  49  | 
  50  |     // 3. Create a new team
  51  |     await page.click('button:has-text("Create Team")');
  52  |     await page.fill('input[name="name"]', `Infrastructure ${uniqueId}`);
  53  |     await page.fill('textarea[name="description"]', 'Cloud DevOps and DB reliability');
  54  |     await page.click('div[role="dialog"] button:has-text("Create Team")');
  55  | 
  56  |     await expect(page.getByText(`Infrastructure ${uniqueId}`)).toBeVisible();
  57  | 
  58  |     // 4. Navigate to Members and verify members exist
  59  |     await page.click('a[href="/members"]');
  60  |     await expect(page.getByRole('heading', { name: 'Workspace Members' })).toBeVisible();
  61  |     await expect(page.getByText('alice@alpha.test')).toBeVisible();
  62  |     await expect(page.getByText('bob@alpha.test')).toBeVisible();
  63  |   });
  64  | 
  65  |   test('E2E-03 & E2E-10: Owner creates a project with no tasks and views dashboard progress as 0%', async ({ page }) => {
  66  |     await page.goto('/login');
  67  |     await page.fill('input[name="email"]', 'owner@alpha.test');
  68  |     await page.fill('input[name="password"]', 'Password1234!');
  69  |     await page.click('button[type="submit"]');
  70  | 
  71  |     // Navigate to Projects
  72  |     await page.click('a[href="/projects"]');
  73  |     await page.click('button:has-text("New Project")');
  74  | 
  75  |     const projectKey = `P${String(uniqueId).slice(-4)}`;
  76  |     await page.fill('input[name="name"]', `Zero Tasks Project ${uniqueId}`);
  77  |     await page.fill('input[name="key"]', projectKey);
  78  |     await page.click('div[role="dialog"] button:has-text("Create Project")');
  79  | 
  80  |     // Open project detail
  81  |     await page.click(`text=Zero Tasks Project ${uniqueId}`);
  82  |     await expect(page.getByText('0%')).toBeVisible();
  83  |     await expect(page.getByText('0', { exact: true }).first()).toBeVisible();
  84  |   });
  85  | 
  86  |   test('E2E-04 & E2E-05: Member creates task, assigns it, updates status, and comments', async ({ page }) => {
  87  |     // Login as Alice (Member of Company Alpha)
  88  |     await page.goto('/login');
  89  |     await page.fill('input[name="email"]', 'alice@alpha.test');
  90  |     await page.fill('input[name="password"]', 'Password1234!');
  91  |     await page.click('button[type="submit"]');
  92  | 
  93  |     // Go to Mobile Application Launch project
  94  |     await page.click('a[href="/projects"]');
  95  |     await page.click('text=Mobile Application Launch');
  96  | 
  97  |     // Add new task
  98  |     await page.click('button:has-text("New Task")');
  99  |     const taskTitle = `E2E Playwright Task ${uniqueId}`;
  100 |     await page.fill('input[name="title"]', taskTitle);
  101 |     await page.selectOption('select[name="priority"]', 'HIGH');
  102 |     await page.click('div[role="dialog"] button:has-text("Create Task")');
  103 | 
  104 |     // Task appears on Kanban board
  105 |     await expect(page.getByText(taskTitle)).toBeVisible();
  106 | 
  107 |     // Click task to open details modal
  108 |     await page.click(`text=${taskTitle}`);
  109 |     await expect(page.getByText('Task Details')).toBeVisible();
  110 | 
  111 |     // Post a comment
```