# Supabase Setup Instructions

## 🚀 Step-by-Step Setup

### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email

### 2. Create New Project
1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `ClosetAssistant`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait 2-3 minutes for project setup

### 3. Get Project Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Key** (anon, public key)

### 4. Set Up Environment Variables
1. In your project root, create `.env.local`:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run Database Setup
1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire contents of `supabase-setup.sql`
3. Paste and click **Run**
4. Verify tables were created in **Table Editor**
5. Should show "Success. No rows returned" when complete

### 6. Configure Authentication
1. Go to **Authentication** → **Settings**
2. **Site URL**: `http://localhost:5173` (for development)
3. **Redirect URLs**: Add `http://localhost:5173/**`
4. Enable **Email confirmations** if desired

### 7. Set Up Storage
1. Go to **Storage**
2. The `clothing-images` bucket should be created automatically
3. Verify policies are set correctly

## 🧪 Test Your Setup

1. Start your app: `npm run dev`
2. Navigate to `/signup`
3. Create a test account
4. Check email for confirmation (if enabled)
5. Sign in and verify dashboard loads

## 📁 Project Structure

After setup, your Supabase integration includes:
- **Authentication**: Sign up, sign in, sign out
- **Database**: 3 tables with Row Level Security
- **Storage**: Image upload for clothing photos
- **API**: Real-time subscriptions ready

## 🔧 Environment Files

```
.env.local (create this)     ← Your actual credentials
.env.example                 ← Template for team
```

## 🛠 Troubleshooting

**Issue**: "Missing Supabase environment variables"
- **Fix**: Check `.env.local` file exists and has correct variables

**Issue**: "Invalid API Key"
- **Fix**: Copy the **anon/public** key, not the **service_role** key

**Issue**: "Email confirmation not working"
- **Fix**: Check spam folder or disable confirmations in Auth settings

**Issue**: RLS policies blocking requests
- **Fix**: Verify user is authenticated and policies are correct

## 📚 Next Steps

With Supabase configured, you can:
1. Implement photo upload in `AddItem` component
2. Create wardrobe data fetching
3. Build outfit suggestion logic
4. Add wear tracking functionality

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [React Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)