# e-MaziShaala (ई-माझीशाळा) — Dedicated Admin Portal

A secure educational operations and content management portal for the **e-MaziShaala** platform. Built with **Angular 21**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Key Modules & Capabilities

1. **Admin Authentication & RBAC**:
   - Google OAuth via Supabase Auth + Admin Email & Password login.
   - Enforced database role verification via `public.is_admin()` RPC and `public.user_roles` checking.
   - Angular `adminGuard` protecting all administrative routes; unauthorized users are automatically redirected and locked out.

2. **Dashboard Overview**:
   - Real-time statistics from Supabase: Total Students, Published Books, Active & Upcoming Batches, Announcements.
   - Quick Action buttons: Add New Book, Create Batch, Broadcast Announcement, Edit Homepage.
   - Activity feeds for recently added books and academic schedules.

3. **Book Management**:
   - Complete CRUD operations on `public.books`.
   - Real-time search by Title, Author, ISBN, or Category.
   - Status filtering (`All`, `Published`, `Draft`), sorting, and pagination.
   - One-click publication and bestseller/featured toggles.
   - Book cover image uploads to Supabase Storage (`book-covers` bucket) with public URL generation.
   - Deletion with confirmation safeguard modal.

4. **Academic Batch Management**:
   - Complete CRUD operations on `public.batches`.
   - Seat capacity tracking with visual progress bars.
   - Status workflow management: `Upcoming`, `Registration Open`, `Full`, `Ongoing`, `Completed`, `Cancelled`.
   - Schedule dates and registration window dates.
   - One-click registration open/close shortcuts.

5. **User Management**:
   - Read-only student directory audit from Supabase `profiles`.
   - Search by student name, email, or account UUID.
   - Safe inspection modal without exposing private credentials.
   - Strict security principle: Administrative roles can only be granted via Supabase SQL Editor.

6. **App Content CMS (Zero-Deployment Updates)**:
   - Dynamic homepage banner image, headline, subtitle, and marquee announcements.
   - Section visibility toggles (`Books`, `Batches`, `Announcements`, `Featured Content`) allowing instant hiding/showing of sections on the student app without APK rebuilds.
   - Broadcast announcement manager with publish/unpublish scheduling and deletion.

7. **System & Portal Settings**:
   - Administrator identity audit.
   - Application title and branding settings.
   - Default currency configuration (INR - ₹).
   - Supabase connection status check.

---

## 🛠️ Local Development & Execution

To run the Admin Portal alongside the existing user application (which typically runs on port 4200):

```bash
# Run Admin Portal on port 4300
npm start -- --port 4300
```

Open `http://localhost:4300` in your web browser.

### Production Build

```bash
npm run build
```

The optimized, production-ready static bundle will be generated in `dist/e-maazishaala-admin/browser`.

---

## 🔐 Supabase Configuration & First Administrator Setup

1. Open your **Supabase Dashboard** -> **SQL Editor**:
   `https://supabase.com/dashboard/project/ozwyifbaqmfuytgwzmjy/sql`

2. Run the migration script located in [`database/supabase_admin_setup.sql`](./database/supabase_admin_setup.sql).

3. To grant administrator privileges to your user account, execute:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## 🛡️ Security Architecture

- **No Service Keys in Frontend**: Uses only `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Database Row Level Security (RLS)**: Enforced on all tables. Anonymous or student users cannot insert, update, or delete content even with direct API requests.
- **Zero Impact on User App**: The user app in `/Users/ayushvaidya/Downloads/e-mazishaala` remains completely intact and unaffected.
