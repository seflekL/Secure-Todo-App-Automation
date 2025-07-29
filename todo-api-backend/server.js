const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let todos = [];
let nextTodoId = 1;

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'testuser' && password === 'password123') {
        res.status(200).json({ message: 'Login successful', token: 'dummy-jwt-token-for-testuser' });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null || token !== 'dummy-jwt-token-for-testuser') {
        return res.status(403).json({ message: 'Unauthorized access.' });
    }
    next();
};

app.get('/todos', authenticateToken, (req, res) => {
    res.status(200).json(todos);
});

app.post('/todos', authenticateToken, (req, res) => {
    const { text } = req.body;
    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Todo text is required.' });
    }
    const newTodo = { id: nextTodoId++, text, completed: false };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

app.put('/todos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { text, completed } = req.body;
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
        return res.status(404).json({ message: `Todo with ID ${id} not found.` });
    }

    if (text !== undefined) todos[todoIndex].text = text;
    if (completed !== undefined) todos[todoIndex].completed = completed;

    res.status(200).json(todos[todoIndex]);
});

app.delete('/todos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = todos.length;
    todos = todos.filter(t => t.id !== id);

    if (todos.length === initialLength) {
        return res.status(404).json({ message: `Todo with ID ${id} not found.` });
    }
    res.status(204).send();
});

app.post('/reset-todos', (req, res) => {
    todos = [];
    nextTodoId = 1;
    res.status(200).json({ message: 'All todos reset successfully.' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
