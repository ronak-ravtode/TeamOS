# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflows.spec.ts >> Team OS End-to-End User Workflows >> E2E-03 & E2E-10: Owner creates a project with no tasks and views dashboard progress as 0%
- Location: e2e\workflows.spec.ts:65:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "JanSahay logo JanSahay" [ref=e7] [cursor=pointer]:
          - /url: /
          - img "JanSahay logo" [ref=e8]
          - generic [ref=e9]: JanSahay
        - navigation "Primary" [ref=e10]:
          - link "Schemes" [ref=e11] [cursor=pointer]:
            - /url: /schemes
          - link "Services" [ref=e12] [cursor=pointer]:
            - /url: /services
          - link "Legal" [ref=e13] [cursor=pointer]:
            - /url: /legal
          - link "Grievance" [ref=e14] [cursor=pointer]:
            - /url: /grievance
      - generic [ref=e15]:
        - link "FAQ" [ref=e16] [cursor=pointer]:
          - /url: /faq
        - button "Change language" [ref=e18] [cursor=pointer]: EN
        - link "Chat" [ref=e21] [cursor=pointer]:
          - /url: /chat
        - generic [ref=e22]:
          - button "⚡ Guest Access" [ref=e23] [cursor=pointer]
          - link "Sign In" [ref=e24] [cursor=pointer]:
            - /url: /sign-in
  - main [ref=e25]:
    - link "Skip to content" [ref=e26] [cursor=pointer]:
      - /url: "#content"
    - generic [ref=e27]:
      - paragraph [ref=e28]: "404"
      - heading "This page does not exist" [level=1] [ref=e29]
      - paragraph [ref=e30]: The link you followed may be broken, or the page may have moved.
      - link [ref=e31] [cursor=pointer]:
        - /url: /
        - button "Back to home" [ref=e32]
  - contentinfo [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]:
          - link "JanSahay logo JanSahay" [ref=e37] [cursor=pointer]:
            - /url: /
            - img "JanSahay logo" [ref=e38]
            - generic [ref=e39]: JanSahay
          - paragraph [ref=e40]: Government assistance for Indian cooperatives.
        - generic [ref=e41]:
          - heading "Schemes & Services" [level=3] [ref=e42]
          - list [ref=e43]:
            - listitem [ref=e44]:
              - link "Schemes" [ref=e45] [cursor=pointer]:
                - /url: /schemes
            - listitem [ref=e46]:
              - link "Services" [ref=e47] [cursor=pointer]:
                - /url: /services
        - generic [ref=e48]:
          - heading "Legal & Support" [level=3] [ref=e49]
          - list [ref=e50]:
            - listitem [ref=e51]:
              - link "Legal" [ref=e52] [cursor=pointer]:
                - /url: /legal
            - listitem [ref=e53]:
              - link "FAQ" [ref=e54] [cursor=pointer]:
                - /url: /faq
            - listitem [ref=e55]:
              - link "Grievance" [ref=e56] [cursor=pointer]:
                - /url: /grievance
        - generic [ref=e57]:
          - heading "Contact" [level=3] [ref=e58]
          - list [ref=e59]:
            - listitem [ref=e60]:
              - link "Chat" [ref=e61] [cursor=pointer]:
                - /url: /chat
            - listitem [ref=e62]: support@jansahay.gov.in
            - listitem [ref=e63]: 1800-XXX-XXXX (Toll free)
      - generic [ref=e64]: © 2026 JanSahay. Built for Indian cooperatives.
  - button "Open chat" [ref=e65] [cursor=pointer]:
    - img "JanSahay Assistant" [ref=e67]
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
  11  |     await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
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
> 67  |     await page.fill('input[name="email"]', 'owner@alpha.test');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
  112 |     await page.fill('textarea[placeholder*="Write a comment"]', 'Automated E2E comment submission.');
  113 |     await page.click('button:has-text("Post Comment")');
  114 |     await expect(page.getByText('Automated E2E comment submission.')).toBeVisible();
  115 | 
  116 |     // Close modal
  117 |     await page.keyboard.press('Escape');
  118 |   });
  119 | 
  120 |   test('E2E-06: Workspace switcher shows different isolated workspace data', async ({ page }) => {
  121 |     // Login as Alpha owner (who belongs to Alpha)
  122 |     await page.goto('/login');
  123 |     await page.fill('input[name="email"]', 'owner@alpha.test');
  124 |     await page.fill('input[name="password"]', 'Password1234!');
  125 |     await page.click('button[type="submit"]');
  126 | 
  127 |     await expect(page.getByText('Company Alpha Overview')).toBeVisible();
  128 |     await expect(page.getByText('Mobile Application Launch')).toBeVisible();
  129 | 
  130 |     // Login as David (Owner of Company Beta)
  131 |     await page.goto('/login');
  132 |     await page.fill('input[name="email"]', 'david@beta.test');
  133 |     await page.fill('input[name="password"]', 'Password1234!');
  134 |     await page.click('button[type="submit"]');
  135 | 
  136 |     // Company Beta overview
  137 |     await expect(page.getByText('Company Beta Overview')).toBeVisible();
  138 |     await expect(page.getByText('Autonomous Agent Fleet')).toBeVisible();
  139 |     // Company Alpha project must NEVER be visible
  140 |     await expect(page.getByText('Mobile Application Launch')).not.toBeVisible();
  141 |   });
  142 | 
  143 |   test('E2E-07 & E2E-09: Member restricted from settings and archived projects', async ({ page }) => {
  144 |     // Login as Alice (Member)
  145 |     await page.goto('/login');
  146 |     await page.fill('input[name="email"]', 'alice@alpha.test');
  147 |     await page.fill('input[name="password"]', 'Password1234!');
  148 |     await page.click('button[type="submit"]');
  149 | 
  150 |     // Go to Settings -> Read-only message is shown
  151 |     await page.click('a[href="/settings"]');
  152 |     await expect(page.getByText(/only workspace owners and administrators can modify settings/i)).toBeVisible();
  153 | 
  154 |     // Go to Projects -> Archived projects
  155 |     await page.click('a[href="/projects"]');
  156 |     await page.click('button:has-text("Archived Projects")');
  157 |     await page.click('text=Legacy Portal Migration');
  158 | 
  159 |     // Archived project notice
  160 |     await expect(page.getByText(/archived \(read only\)/i)).toBeVisible();
  161 |     // New Task button is hidden/disabled for ordinary member
  162 |     await expect(page.getByRole('button', { name: /new task/i })).not.toBeVisible();
  163 |   });
  164 | });
  165 | 
  166 | 
```