# Cardland Draft

A modern draft application built with Next.js 14, Supabase, and TypeScript. This application allows users to log in, join drafts, and pick teams in a set order with real-time updates.

## Features

- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Role-based Access**: Admin and user roles with different permissions
- **Draft Management**: Admins can create, edit, and delete drafts
- **Live Draft Participation**: Users can join active drafts and make picks
- **Real-time Updates**: Live updates during draft sessions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the SQL from `supabase/migrations/create_complete_schema.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables:

- **users**: User profiles with roles (admin/user)
- **drafts**: Draft sessions with settings and status
- **participants**: Users participating in specific drafts
- **selections**: Available items to pick from in each draft
- **picks**: Records of user selections during drafts

## Usage

### For Admins

1. Sign up/in to the application
2. Update your role to 'admin' in the Supabase users table
3. Access the Admin panel to create and manage drafts
4. Add selections to drafts for users to pick from

### For Users

1. Sign up/in to the application
2. View available drafts on the dashboard
3. Join active drafts and make your picks when it's your turn
4. View draft results and pick history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.