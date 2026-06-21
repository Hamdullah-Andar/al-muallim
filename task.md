# Al-Mu'allim Task List

## 1. Project Initialization
- [x] Initialize Next.js project locally in `scratch/al-muallim`.
- [x] Connect local repository to GitHub.
- [x] Install Supabase client dependencies.

## 2. Core Foundation
- [x] Setup Tailwind CSS matching design colors (Deep Green).
- [x] Configure Supabase client and environment variables.
- [x] Setup authentication context and route protection.

## 3. Database Schema & API
- [x] Create Supabase SQL migrations for:
  - Profiles (Users & Roles)
  - Classes & Class_Students
  - Assignments (with dynamic JSONB content)
  - Student_Progress
  - Books
  - Class_Discussions (with Announcements)
  - Achievements (Badges)
- [x] Write API routes/Server Actions to interact with database.
- [ ] Setup Swagger/OpenAPI documentation for custom API routes.

## 4. UI Implementation (Teacher)
- [x] Register / Sign Up Page.
- [x] Teacher Dashboard (Analytics, Active Classes).
- [x] Create Class Flow.
- [x] Class Detail View (Student progress list).
- [x] Create Assignment Flow (Dynamic forms for Zikr, Reading, etc.).

## 5. UI Implementation (Student)
- [x] Student Dashboard (Streak, Daily Focus).
- [x] Join Class Flow.
- [x] Assignment Completion Flow (Marking Zikr/Prayers complete).
- [x] Personal Performance Analytics View.

## 6. Polish & Gamification
- [x] Build dynamic Dashboard logic (Streaks, Next Prayer, Categories).
- [x] Build dynamic Analytics logic (Charts, Discipline Checklists).
- [ ] Responsive design adjustments.
- [ ] Loading states and error handling.
- [ ] Final visual QA against designs.
