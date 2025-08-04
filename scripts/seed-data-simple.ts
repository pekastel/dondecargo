import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local first, then .env
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../drizzle/schema';
import { clients, projects, timeEntries } from '../drizzle/schema';
import { user } from '../drizzle/better-auth-schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// For testing purposes, we'll create multiple users
// In production, you'll replace this with your actual user ID
const USERS = [
  { id: 'test-user-123', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'test-user-456', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'test-user-789', name: 'Carol Davis', email: 'carol@example.com' },
  { id: 'test-user-012', name: 'David Wilson', email: 'david@example.com' },
];

const PRIMARY_USER_ID = process.env.SEED_USER_ID || 'test-user-123';

async function seedDataSimple() {
  console.log('🌱 Starting database seed with multiple users...');
  console.log('📝 Primary USER_ID:', PRIMARY_USER_ID);
  console.log('👥 Creating data for users:', USERS.map(u => u.name).join(', '));
  console.log('🔌 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('');
  
  // Create database client with SSL disabled
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  
  const db = drizzle(client, { schema });
  
  try {
    // Connect to database
    await client.connect();
    console.log('✅ Database connection successful');
    console.log('');
    
    // Clear existing data for all users
    console.log('🧹 Clearing existing data for all test users...');
    try {
      for (const userData of USERS) {
        await db.delete(timeEntries).where(eq(timeEntries.userId, userData.id));
        await db.delete(projects).where(eq(projects.userId, userData.id));
        await db.delete(clients).where(eq(clients.userId, userData.id));
        await db.delete(user).where(eq(user.id, userData.id));
      }
      console.log('✅ Existing data cleared');
    } catch (deleteError) {
      console.log('ℹ️  No existing data to clear (tables might be empty)');
    }

    // Create users first
    console.log('👤 Creating users...');
    const usersToInsert = USERS.map(userData => ({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: null,
      banned: false,
      banReason: null,
      banExpires: null,
    }));
    
    const insertedUsers = await db.insert(user).values(usersToInsert).returning();
    console.log(`✅ Created ${insertedUsers.length} users`);

    // Create sample clients for all users
    console.log('');
    console.log('👥 Creating sample clients for all users...');
    const allClientsData = [];
    
    for (const user of USERS) {
      const userClients = [
        {
          id: nanoid(),
          name: `${user.name.split(' ')[0]}'s Corp`,
          description: `${user.name}'s primary business client`,
          userId: user.id,
          active: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: nanoid(),
          name: `${user.name.split(' ')[0]} Startup`,
          description: `${user.name}'s startup client`,
          userId: user.id,
          active: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
        },
        {
          id: nanoid(),
          name: `${user.name.split(' ')[0]} Local`,
          description: `${user.name}'s local business client`,
          userId: user.id,
          active: true,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10'),
        },
      ];
      allClientsData.push(...userClients);
    }

    const insertedClients = await db.insert(clients).values(allClientsData).returning();
    console.log(`✅ Created ${insertedClients.length} clients for ${USERS.length} users`);

    // Create sample projects for all users
    console.log('');
    console.log('📁 Creating sample projects for all users...');
    const allProjectsData: any[] = [];
    
    const projectTemplates = [
      { name: 'E-commerce Platform', description: 'Build a modern e-commerce solution', rate: '125.00' },
      { name: 'Mobile App Development', description: 'React Native mobile application', rate: '150.00' },
      { name: 'Website Redesign', description: 'Complete website overhaul with modern design', rate: '100.00' },
      { name: 'SEO Optimization', description: 'Improve search engine rankings', rate: '80.00' },
      { name: 'Business Consultation', description: 'Strategic business advisory services', rate: '200.00' },
    ];
    
    for (const user of USERS) {
      const userClients = insertedClients.filter(client => client.userId === user.id);
      
      projectTemplates.forEach((template, index) => {
        const clientIndex = index % userClients.length;
        allProjectsData.push({
          id: nanoid(),
          name: `${user.name.split(' ')[0]}'s ${template.name}`,
          description: template.description,
          clientId: userClients[clientIndex].id,
          userId: user.id,
          hourlyRate: template.rate,
          active: true,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
        });
      });
    }

    const insertedProjects = await db.insert(projects).values(allProjectsData).returning();
    console.log(`✅ Created ${insertedProjects.length} projects for ${USERS.length} users`);

    // Create sample time entries for all users
    console.log('');
    console.log('⏰ Creating sample time entries for all users...');
    const allTimeEntriesData = [];
    const now = new Date();
    
    const descriptions = [
      'Frontend development work',
      'Backend API implementation',
      'Database schema design',
      'Code review and testing',
      'Client meeting and requirements gathering',
      'Bug fixes and optimization',
      'Documentation and planning',
      'UI/UX improvements',
      'Performance optimization',
      'Security enhancements',
    ];
    
    for (const user of USERS) {
      const userProjects = insertedProjects.filter(project => project.userId === user.id);
      
      // Generate time entries for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Skip weekends for more realistic data
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Create 1-3 entries per day for each user
        const entriesPerDay = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < entriesPerDay; j++) {
          const project = userProjects[Math.floor(Math.random() * userProjects.length)];
          const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
          const durationMinutes = (Math.floor(Math.random() * 4) + 1) * 60 + (Math.floor(Math.random() * 4) * 15); // 1-4 hours in 15min increments
          
          const startTime = new Date(date);
          startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + durationMinutes);
          
          allTimeEntriesData.push({
            id: nanoid(),
            projectId: project.id,
            userId: user.id,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            startTime,
            endTime,
            durationMinutes,
            isActive: false,
            createdAt: startTime,
            updatedAt: startTime,
          });
        }
      }
    }

    // Add one active entry for the primary user
    const primaryUserProjects = insertedProjects.filter(project => project.userId === PRIMARY_USER_ID);
    if (primaryUserProjects.length > 0) {
      const activeProject = primaryUserProjects[0];
      const activeStartTime = new Date();
      activeStartTime.setHours(activeStartTime.getHours() - 2, 0, 0, 0);
      
      allTimeEntriesData.push({
        id: nanoid(),
        projectId: activeProject.id,
        userId: PRIMARY_USER_ID,
        description: 'Current work session - building dashboard',
        startTime: activeStartTime,
        endTime: null,
        durationMinutes: null,
        isActive: true,
        createdAt: activeStartTime,
        updatedAt: activeStartTime,
      });
    }

    const insertedTimeEntries = await db.insert(timeEntries).values(allTimeEntriesData).returning();
    console.log(`✅ Created ${insertedTimeEntries.length} time entries for ${USERS.length} users`);

    console.log('');
    console.log('🎉 Database seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Primary User ID: ${PRIMARY_USER_ID}`);
    console.log(`  - ${USERS.length} users with data created`);
    console.log(`  - ${insertedClients.length} clients created`);
    console.log(`  - ${insertedProjects.length} projects created`);
    console.log(`  - ${insertedTimeEntries.length} time entries created`);
    console.log('');
    console.log('👥 User Details:');
    USERS.forEach(user => {
      const userEntries = insertedTimeEntries.filter(entry => entry.userId === user.id);
      console.log(`  - ${user.name} (${user.id}): ${userEntries.length} entries`);
    });
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Sign up/login to the app with a user that has one of these IDs');
    console.log('2. Or update the reports API to use one of these USER_IDs for testing');
    console.log('3. Visit http://localhost:3000/reports to see the dashboard');
    console.log('4. Test the multi-user filtering functionality');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Make sure your DATABASE_URL is correctly set in .env.local');
    console.log('2. Ensure the database is running and accessible');
    console.log('3. Run `pnpm db:migrate` to ensure all tables exist');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seed
seedDataSimple()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });