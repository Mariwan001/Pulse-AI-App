# AI Onboarding Setup Instructions

## Overview
This project now includes a personalized AI onboarding experience that collects user preferences and integrates them throughout the application.

## Features
- **Personalized Onboarding**: Collects AI name, user name, and response style preferences
- **Data Persistence**: Saves preferences to both localStorage and Supabase
- **Smooth Transitions**: Beautiful animations and seamless page transitions
- **AI Integration**: Uses preferences to personalize AI responses
- **Smart Suggestions**: Personalized chat suggestions based on user data

## Database Setup

### 1. Create the User Preferences Table
Run the following SQL in your Supabase SQL editor:

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  ai_name TEXT,
  user_name TEXT,
  response_style TEXT CHECK (response_style IN ('detailed', 'concise')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Environment Variables
Make sure your `.env.local` file includes:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How It Works

### 1. First Visit
- When a user first visits the site, they see the onboarding flow
- The onboarding collects:
  - AI assistant name
  - User's name
  - Response style preference (detailed vs concise)

### 2. Data Storage
- Preferences are saved to both localStorage (for immediate access) and Supabase (for persistence)
- A unique user ID is generated and stored

### 3. AI Integration
- The AI uses the preferences to personalize responses
- AI will use the chosen name when referring to itself
- AI will use the user's name naturally in conversation
- Response style affects how detailed the AI's answers are

### 4. Personalized Experience
- Chat suggestions are personalized based on user preferences
- The main page shows personalized content
- Smooth transitions between onboarding and main content

## File Structure

```
src/
├── components/
│   └── onboarding/
│       └── AIOnboarding.tsx          # Main onboarding component
├── lib/
│   └── types.ts                      # Updated with UserPreferences interface
├── store/
│   └── chat-store.ts                 # Updated with preferences management
├── app/
│   ├── page.tsx                      # Updated to show onboarding first
│   └── api/
│       └── chat/
│           └── route.ts              # Updated to use preferences
└── components/
    └── sections/
        └── HyperIronicHero.tsx       # Updated to accept preferences
```

## Testing

1. Clear your browser's localStorage to test the onboarding flow
2. Complete the onboarding steps
3. Check that preferences are saved in both localStorage and Supabase
4. Test that AI responses are personalized
5. Verify that chat suggestions are personalized

## Customization

You can customize the onboarding by:
- Modifying the questions in `AIOnboarding.tsx`
- Adding more preference fields to the `UserPreferences` interface
- Updating the AI system prompts in `route.ts`
- Customizing the UI styling and animations

## Troubleshooting

- If onboarding doesn't show, check that localStorage is cleared
- If preferences aren't saving, verify Supabase connection and table setup
- If AI isn't personalized, check that the preferences are being passed correctly 