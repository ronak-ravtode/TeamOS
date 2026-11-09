# Team OS — Database Schema Specification

## 1. Relational Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : "has memberships"
    User ||--o{ RefreshToken : "owns sessions"
    User ||--o{ TeamMember : "belongs to teams"
    User ||--o{ Task : "creates/assigned"
    User ||--o{ TaskComment : "authors"

    Workspace ||--o{ WorkspaceMember : "contains"
    Workspace ||--o{ Team : "contains"
    Workspace ||--o{ Project : "contains"
    Workspace ||--o{ Task : "contains"
    Workspace ||--o{ TaskComment : "contains"

    Team ||--o{ TeamMember : "has"
    Team ||--o{ Project : "assigned to"

    Project ||--o{ Task : "contains"
    Task ||--o{ TaskComment : "contains"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        uuid id PK
        uuid userId FK
        string hashedToken
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    Workspace {
        uuid id PK
        string name
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    WorkspaceMember {
        uuid id PK
        uuid workspaceId FK
        uuid userId FK
        enum role
        datetime joinedAt
        datetime updatedAt
    }

    Team {
        uuid id PK
        uuid workspaceId FK
        string name
        string description
        uuid createdById FK
        datetime createdAt
        datetime updatedAt
    }

    TeamMember {
        uuid id PK
        uuid teamId FK
        uuid userId FK
        datetime joinedAt
    }

    Project {
        uuid id PK
        uuid workspaceId FK
        string name
        string key
        string description
        uuid teamId FK
        enum status
        date startDate
        date targetDate
        uuid createdById FK
        datetime createdAt
        datetime updatedAt
    }

    Task {
        uuid id PK
        uuid workspaceId FK
        uuid projectId FK
        int taskNumber
        string title
        string description
        enum status
        enum priority
        uuid assigneeId FK
        uuid creatorId FK
        date startDate
        date dueDate
        float position
        datetime createdAt
        datetime updatedAt
    }

    TaskComment {
        uuid id PK
        uuid workspaceId FK
        uuid taskId FK
        uuid authorId FK
        string content
        datetime createdAt
        datetime updatedAt
    }
```

---

## 2. Enums and Controlled Fields

### `WorkspaceRole`
- `OWNER`
- `ADMIN`
- `MEMBER`

### `ProjectStatus`
- `ACTIVE`
- `ARCHIVED`

### `TaskStatus`
- `BACKLOG`
- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `BLOCKED`
- `DONE`

### `TaskPriority`
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

---

## 3. Relational Constraints & Indexes

1. **Unique Constraints**:
   - `User.email` (unique, lowercase)
   - `Workspace.slug` (unique)
   - `WorkspaceMember(workspaceId, userId)` (composite unique)
   - `TeamMember(teamId, userId)` (composite unique)
   - `Project(workspaceId, key)` (composite unique: project key unique within workspace)
   - `Task(projectId, taskNumber)` (composite unique: incremental task number per project)

2. **Indexes for Performance & Isolation**:
   - `WorkspaceMember(workspaceId, userId)`
   - `Project(workspaceId, status)`
   - `Task(workspaceId, projectId, status)`
   - `Task(workspaceId, assigneeId)`
   - `Task(workspaceId, dueDate)`
   - `TaskComment(workspaceId, taskId, createdAt)`
   - `Team(workspaceId)`

3. **Cascade & Integrity Rules**:
   - `WorkspaceMember`: `onDelete: Cascade` when Workspace is deleted; `onDelete: Cascade` when User is deleted.
   - `Team`: `onDelete: Cascade` when Workspace is deleted.
   - `TeamMember`: `onDelete: Cascade` when Team is deleted.
   - `Project`: `onDelete: Cascade` when Workspace is deleted. Project does NOT delete team. If team is deleted, `Project.teamId` becomes `SetNull`.
   - `Task`: `onDelete: Cascade` when Project is deleted. If assignee is removed from workspace, `assigneeId` is set to null or preserved historically without losing task.
   - `TaskComment`: `onDelete: Cascade` when Task is deleted.

