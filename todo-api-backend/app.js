 

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;  

app.use(bodyParser.json());

 
let items = [
    { id: 'item1', name: 'Existing Item 1', completed: false },
    { id: 'item2', name: 'Existing Item 2', completed: true }
];
let nextItemId = 3;  

const MOCK_USER = {
    username: 'testuser',
    password: 'password123',
    token: 'mock-auth-token-123'
};


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 


    if (token == null) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    if (token !== MOCK_USER.token) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    
    next();
}

 app.get('/', (req, res) => {
    res.status(200).send('Mock API is running');
});

 app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === MOCK_USER.username && password === MOCK_USER.password) {
        return res.status(200).json({ token: MOCK_USER.token, message: 'Login successful' });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

 app.get('/items', authenticateToken, (req, res) => {
    res.status(200).json(items);
});

 app.post('/items', authenticateToken, (req, res) => {
    const { name, completed } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Item name is required' });
    }
    const newItem = {
        id: `item${nextItemId++}`,
        name,
        completed: completed !== undefined ? completed : false
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

 app.put('/items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, completed } = req.body;

    const itemIndex = items.findIndex(item => item.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found' });
    }

    if (!name && completed === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    if (name !== undefined) {
        items[itemIndex].name = name;
    }
    if (completed !== undefined) {
        items[itemIndex].completed = completed;
    }

    res.status(200).json(items[itemIndex]);
});

 app.delete('/items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const initialLength = items.length;
    items = items.filter(item => item.id !== id);

    if (items.length === initialLength) {
        return res.status(404).json({ message: 'Item not found' });
    }
    res.status(204).send(); 
});

 module.exports = app;