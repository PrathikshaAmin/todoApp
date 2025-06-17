const API_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary DOM elements
    const addTaskForm = document.getElementById('addTaskForm');
    const taskInput = document.getElementById('taskInput');
    const taskPriority = document.getElementById('taskPriority');
    const taskDate = document.getElementById('taskDate');
    const taskList = document.getElementById('taskList');
    const filterTasks = document.getElementById('filterTasks');
    const logoutButton = document.getElementById('logoutButton');
    const reminderButton = document.getElementById('reminderButton');
    const searchInput = document.getElementById('searchInput');
    // Check for authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();

    // Initialize function
    function initializeDashboard() {
        // Set minimum date as today
        taskDate.min = new Date().toISOString().split('T')[0];

        // Display user name
        const userName = localStorage.getItem('userName');
        document.getElementById('userName').textContent = userName || 'User';

        // Load initial tasks
        loadTasks();

        // Add event listeners
        setupEventListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Add task form submission
        addTaskForm?.addEventListener('submit', handleAddTask);

        // Search functionality with debounce
        searchInput?.addEventListener('input', debounce(handleSearch, 300));

        // Filter tasks
        filterTasks?.addEventListener('change', handleFilter);

        // Reminder button
        reminderButton?.addEventListener('click', handleReminder);

        // Logout button
        logoutButton?.addEventListener('click', handleLogout);
    }

    // Handle add task
    async function handleAddTask(e) {
        e.preventDefault();

        const task = {
            title: taskInput.value,
            priority: taskPriority.value,
            dueDate: taskDate.value,
            completed: false,
            userId: localStorage.getItem('userId')
        };

        try {
            const response = await fetch(`${API_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add task');
            }

            const newTask = await response.json();
            console.log('New task added:', newTask); // Debug log

            // Clear form
            addTaskForm.reset();
            
            // Reload tasks to update the list and stats
            await loadTasks();
    
            showNotification('Task added successfully!', 'success');
        } catch (error) {
            console.error('Error adding task:', error);
            showNotification('Error adding task: ' + error.message, 'error');
        }
    }

    // Handle search
    async function handleSearch(e) {
        const searchTerm = e.target.value.trim();
        try {
            const response = await fetch(`${API_URL}/api/tasks/search?term=${searchTerm}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const tasks = await response.json();
                displayTasks(tasks);
            }
        } catch (error) {
            console.error('Error searching tasks:', error);
        }
    }

    // Handle filter
    async function handleFilter() {
        filterTasks?.addEventListener('change', async () => {
            try {
                const response = await fetch(`${API_URL}/api/tasks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    let tasks = await response.json();
                    const filter = filterTasks.value;
        
                    // Apply filters locally
                    switch(filter) {
                        case 'completed':
                            tasks = tasks.filter(task => task.completed);
                            break;
                        case 'pending':
                            tasks = tasks.filter(task => !task.completed);
                            break;
                        case 'overdue':
                            tasks = tasks.filter(task => !task.completed && isOverdue(task.dueDate));
                            break;
                        // 'all' shows everything
                    }
        
                    displayTasks(tasks);
                    updateTaskSummary(tasks);
                }
            } catch (error) {
                console.error('Error filtering tasks:', error);
                showNotification('Error filtering tasks', 'error');
            }
        }); 
    }       

    // Handle reminder
    async function handleReminder() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login first', 'error');
                return;
            }
    
            const response = await fetch(`${API_URL}/api/tasks/send-reminder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            const data = await response.json();
    
            if (response.ok) {
                showNotification(data.message, 'success');
            } else {
                throw new Error(data.message || 'Failed to send reminder');
            }
        } catch (error) {
            console.error('Reminder error:', error);
            showNotification('Failed to send reminder', 'error');
        }
    }
    
    // Handle logout
    function handleLogout() {
        localStorage.clear();
        window.location.href = 'login.html';
    }

    // Load tasks from database
    async function loadTasks() {
        try {
            const response = await fetch(`${API_URL}/api/tasks`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to fetch tasks');
            }
    
            const tasks = await response.json();
            console.log('Fetched tasks:', tasks); // Debug log
            displayTasks(tasks);
            updateTaskSummary(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            taskList.innerHTML = '<p>Error loading tasks. Please try again.</p>';
        }
    }

    // Display tasks in the list
    function displayTasks(tasks) {
        console.log('Tasks to display:', tasks); // Debug log
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        if (!Array.isArray(tasks) || tasks.length === 0) {
            taskList.innerHTML = `
                <li class="no-tasks">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks found.Add your first task!</p>
                </li>
            `;
            return;
        }
    
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate) ? 'overdue' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTaskStatus('${task._id}')">
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-meta">
                        <span class="due-date ${getStatusClass(task)}">
                            <i class="far fa-calendar"></i> ${formatDate(task.dueDate)}
                            (${getTimeRemaining(task.dueDate)})
                        </span>
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button onclick="editTask('${task._id}')" class="action-btn edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask('${task._id}')" class="action-btn delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });
        // Update task summary after displaying tasks
    updateTaskSummary(tasks);
}

    // Update task summary
    function updateTaskSummary(tasks) {
        console.log('Tasks for summary:', tasks); // Debug log
    
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const overdue = tasks.filter(task => 
            !task.completed && new Date(task.dueDate) < new Date()
        ).length;
    
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;
        console.log('Stats updated:', { total, completed, pending, overdue }); // Debug log
    }

    // Helper Functions
    function getTimeRemaining(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (diff < 0) return 'Overdue';
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `${days} days remaining`;
    }

    function getStatusClass(task) {
        if (task.completed) return 'completed';
        if (isOverdue(task.dueDate)) return 'overdue';
        return '';
    }

    function isOverdue(dueDate) {
        return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Notification function
    function showNotification(message, type= 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}


    // Global task action functions
    window.toggleTaskStatus = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${taskId}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            loadTasks();
            showNotification('Task updated successfully!', 'success');
        } catch (error) {
            console.error('Error toggling task status:', error);
            showNotification('Error updating task', 'error');
        }
    };

    window.deleteTask = async (taskId) => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete task');
                }

                loadTasks();
                showNotification('Task deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting task:', error);
                showNotification('Error deleting task', 'error');
            }
        }
    };

    window.editTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task details');
            }

            const task = await response.json();
            
            taskInput.value = task.title;
            taskPriority.value = task.priority;
            taskDate.value = task.dueDate.split('T')[0];
            
            // Change button text to indicate editing mode
            const submitButton = addTaskForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-save"></i> Update Task';
            
            // Change form submit behavior
            const originalSubmitHandler = addTaskForm.onsubmit;
            addTaskForm.onsubmit = async (e) => {
                e.preventDefault();
                
                try {
                    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: taskInput.value,
                            priority: taskPriority.value,
                            dueDate: taskDate.value
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update task');
                    }

                    loadTasks();
                    addTaskForm.reset();
                    addTaskForm.onsubmit = originalSubmitHandler;
                    submitButton.innerHTML = originalButtonText;
                    showNotification('Task updated successfully!', 'success');
                } catch (error) {
                    console.error('Error updating task:', error);
                    showNotification('Error updating task', 'error');
                }
            };
        } catch (error) {
            console.error('Error fetching task details:', error);
            showNotification('Error fetching task details', 'error');
        }
    };
});
