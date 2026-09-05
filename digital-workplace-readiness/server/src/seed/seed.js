require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Task.deleteMany({}),
      Attendance.deleteMany({}),
      Meeting.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin',
      jobTitle: 'Workplace Administrator',
      department: 'Operations',
      workMode: 'Office',
      status: 'Active',
      readiness: { connectivity: 95, equipment: 90, scheduleSync: 90 }
    });

    const emp1 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@company.com',
      password: 'Employee@123',
      role: 'employee',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      workMode: 'Hybrid',
      status: 'Active',
      readiness: { connectivity: 80, equipment: 75, scheduleSync: 70 }
    });

    const emp2 = await User.create({
      name: 'Rohan Verma',
      email: 'rohan@company.com',
      password: 'Employee@123',
      role: 'employee',
      jobTitle: 'UI/UX Designer',
      department: 'Design',
      workMode: 'Remote',
      status: 'Active',
      readiness: { connectivity: 55, equipment: 45, scheduleSync: 60 }
    });

    console.log('[Seed] Created users: admin, priya, rohan');

    const team = await Team.create({
      name: 'Product Engineering',
      description: 'Core product development team',
      leader: emp1._id,
      members: [emp1._id, emp2._id]
    });

    emp1.team = team._id;
    emp2.team = team._id;
    await emp1.save();
    await emp2.save();
    console.log('[Seed] Created team: Product Engineering');

    await Task.create([
      {
        title: 'Design new dashboard UI',
        description: 'Create Figma mockups for the hybrid workplace dashboard',
        assignedTo: emp2._id,
        assignedBy: admin._id,
        priority: 'High',
        status: 'In Progress',
        progress: 40,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Implement authentication module',
        description: 'JWT-based login/register with bcrypt password hashing',
        assignedTo: emp1._id,
        assignedBy: admin._id,
        priority: 'Urgent',
        status: 'Completed',
        progress: 100,
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure automated build and deployment',
        assignedTo: emp1._id,
        assignedBy: admin._id,
        priority: 'Medium',
        status: 'Pending',
        progress: 0,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('[Seed] Created sample tasks');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await Attendance.create([
      { employee: emp1._id, date: yesterday, status: 'Present', workMode: 'Office' },
      { employee: emp2._id, date: yesterday, status: 'Present', workMode: 'Remote' },
      { employee: emp1._id, date: today, status: 'Present', workMode: 'Hybrid' }
    ]);
    console.log('[Seed] Created attendance records');

    await Meeting.create({
      title: 'Weekly Sprint Planning',
      description: 'Plan tasks for the upcoming sprint',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      duration: 45,
      meetingLink: 'https://meet.google.com/sample-link',
      createdBy: admin._id,
      teams: [team._id],
      attendees: [emp1._id, emp2._id]
    });
    console.log('[Seed] Created sample meeting');

    await Notification.create([
      {
        user: emp1._id,
        type: 'task',
        title: 'New Task Assigned',
        message: 'You have been assigned: Implement authentication module',
        link: '/tasks'
      },
      {
        user: emp2._id,
        type: 'meeting',
        title: 'New Meeting Scheduled',
        message: 'Weekly Sprint Planning has been scheduled',
        link: '/meetings'
      }
    ]);
    console.log('[Seed] Created sample notifications');

    await Message.create([
      { sender: emp1._id, receiver: admin._id, content: 'Good morning! I have a question about the deployment.' },
      { sender: admin._id, receiver: emp1._id, content: 'Sure, go ahead and ask.' }
    ]);
    console.log('[Seed] Created sample chat messages');

    console.log('\n=================================================');
    console.log(' SEED COMPLETE - Demo Credentials');
    console.log('=================================================');
    console.log(' Admin    -> email: admin@company.com    | password: Admin@123');
    console.log(' Employee -> email: priya@company.com    | password: Employee@123');
    console.log(' Employee -> email: rohan@company.com    | password: Employee@123');
    console.log('=================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err);
    process.exit(1);
  }
};

run();
