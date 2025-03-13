import { createClient } from './server';

async function setupDatabase() {
    try {
        const supabase = await createClient();

        // Create users table
        const { error } = await supabase.rpc('create_users_table', {
            sql_command: `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    firebase_uid TEXT UNIQUE NOT NULL,
                    email TEXT,
                    name TEXT,
                    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        if (error) {
            console.error('Error creating users table:', error);
            return;
        }

        console.log('Users table created successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase();
