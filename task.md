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
- [x] Responsive design adjustments.
- [x] Loading states and error handling.
- [ ] Final visual QA against designs.

## 7. Dashboard Redesign & Multi-Zikr Tracking
- [x] Build global Left Sidebar layout (`src/app/student/layout.tsx`).
- [x] Build Top Stats Row (Streak and Overall Completion cards).
- [x] Build `ZikrTrackerRow.tsx` and implement Left Column (Spiritual Rituals).
- `[x]` Build `AcademicTaskCard.tsx` and implement Right Column (Academic & Self-Improvement).
- `[x]` Build `MankiratTracker.tsx` for tracking negative habits (5 senses) via JSONB.
- `[x]` Build `DailyPrayersCard.tsx` with dynamic lock/unlock syncing to live Aladhan API.
- `[x]` Automate Teacher Dashboard to lock titles and tracking types for Munkarat and Prayer assignments.
- `[x]` Redesign Joined Classes cards with images.

## 8. Syncing, Archiving, and Layout Polish
- `[x]` **Multi-Class Prayer Sync**
  - `[x]` Update `togglePrayerMask` to fetch and sync all active prayer assignments.
  - `[x]` Conditionally render Daily Prayers only for classes with prayer assignments.
- `[x]` **Student Dashboard Layout**
  - `[x]` Order non-prayer assignments by `created_at` (ascending).
  - `[x]` Split assignments into a 2-column grid (left and right chronologically).
- `[x]` **Class Archiving Feature**
  - `[x]` Create SQL migration `04_add_is_active_to_classes.sql`.
  - `[x]` Add `toggleClassActiveStatus` to `src/app/teacher/class/[id]/actions.ts`.
  - `[x]` Add "Archive Class" button to `src/app/teacher/class/[id]/ClassDetailClient.tsx`.
  - `[x]` Filter archived classes from the active dashboard in `src/app/student/dashboard/page.tsx`.

## 9. Digital Library & Linked Progress Tracking
- `[x]` **Class Books & Storage**
  - `[x]` Create SQL migration `02_class_books.sql`.
  - `[x]` Build direct-to-storage PDF upload logic in `ClassDetailClient.tsx`.
  - `[x]` Implement `uploadClassBook` and `deleteClassBook` in `actions.ts`.
- `[x]` **Book Progress Syncing**
  - `[x]` Create SQL migration `03_book_progress.sql`.
  - `[x]` Update student dashboard to query `book_progress` and historical progress.
  - `[x]` Upgrade `AcademicTaskCard.tsx` to display dynamic `starting_point` logic based on previous reading history.
