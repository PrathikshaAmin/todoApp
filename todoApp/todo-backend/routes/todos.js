const express = require('express');
const mongoose = require('mongoose');
const Todo = require('../models/todo'); // Import the Todo model
const authenticateToken = require('../middleware/authenticateToken'); // Middleware to verify token

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Get all todos for the logged-in user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.userId }); // Fetch todos for the logged-in user
    res.status(200).json({ success: true, data: todos });
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  const { task } = req.body;

  // Validate request data
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ success: false, message: 'Task is required and must be a string' });
  }

  try {
    const todo = new Todo({
      userId: req.user.userId, // Use userId from the token
      task,
      completed: false,
    });
    await todo.save();
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  // Validate todo ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid todo ID' });
  }

  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Ensure the todo belongs to the logged-in user
      req.body,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.status(200).json({ success: true, data: todo });
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  // Validate todo ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid todo ID' });
  }

  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.userId }); // Ensure the todo belongs to the logged-in user

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.status(200).json({ success: true, message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

module.exports = router;