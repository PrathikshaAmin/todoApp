const nodemailer = require('nodemailer');
const Task = require('../models/todo'); // Import the Task model
const User = require('../models/user'); // Import the User model
const cron = require('node-cron');

// Validate environment variables
if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing required email environment variables');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Loaded' : 'Not Loaded');
    process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test the email connection when the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error('Email service error:', error);
        console.log('Check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS environment variables.');
    } else {
        console.log('Email service is ready to send messages');
    }
});

// Function to send reminder email
const sendReminderEmail = async (userEmail, tasks) => {
    try {
        const tasksList = tasks.map(task => `
            <li style="margin-bottom: 15px; padding: 15px; background-color: ${task.priority === 'high' ? '#fff3f3' : task.priority === 'medium' ? '#fff8e6' : '#f3fff3'}; border-radius: 8px; border-left: 4px solid ${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745'}">
                <strong style="font-size: 16px; color: #333;">${task.title}</strong><br>
                <div style="margin-top: 8px; color: #666; font-size: 14px;">
                    <span>📅 Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span><br>
                    <span>🎯 Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                </div>
            </li>
        `).join('');

        const mailOptions = {
            from: {
                name: 'Todo App Reminder',
                address: process.env.EMAIL_USER
            },
            to: userEmail,
            subject: '📋 Your Task Reminders - Action Required',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #4361ee; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Task Reminder</h1>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px;">Hello,</p>
                        <p style="color: #333; font-size: 16px;">You have the following tasks that require your attention:</p>
                        <ul style="list-style-type: none; padding: 0; margin: 20px 0;">
                            ${tasksList}
                        </ul>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <p style="color: #666; margin: 0; font-size: 14px;">
                                ⭐ Pro Tip: Complete high-priority tasks first to stay on track!
                            </p>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 12px; text-align: center;">
                                This is an automated reminder from your Todo App.<br>
                                Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Function to send automatic reminders
const sendAutomaticReminders = async () => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Set time to 00:00:00

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // Set time to 23:59:59

        console.log('Start of today:', startOfToday);
        console.log('End of today:', endOfToday);

        const tasksToRemind = await Task.find({
            completed: false,
            dueDate: {
                $gte: startOfToday, // Tasks due today or later
                $lte: endOfToday    // Tasks due by the end of today
            }
        }).populate('userId', 'email');

        console.log('Tasks to remind:', tasksToRemind);

        const userTasks = {};
        tasksToRemind.forEach(task => {
            if (!userTasks[task.userId.email]) {
                userTasks[task.userId.email] = [];
            }
            userTasks[task.userId.email].push(task);
        });

        for (const [userEmail, tasks] of Object.entries(userTasks)) {
            console.log('Sending email to:', userEmail, 'with tasks:', tasks);
            await sendReminderEmail(userEmail, tasks);
        }

        console.log('Automatic reminders sent successfully');
    } catch (error) {
        console.error('Error sending automatic reminders:', error);
    }
};

// Schedule automatic reminders using node-cron
cron.schedule('0 0 * * *', sendAutomaticReminders);

module.exports = { sendReminderEmail };