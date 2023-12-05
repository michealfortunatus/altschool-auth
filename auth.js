const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const usersFilePath = path.join(__dirname, 'users.json');
const itemsFilePath = path.join(__dirname, 'items.json');

// Function to read users from the JSON file
const readUsersFromFile = () => {
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
};

// Function to write users to the JSON file
const writeUsersToFile = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Function to read items from the JSON file
const readItemsFromFile = () => {
  const data = fs.readFileSync(itemsFilePath, 'utf8');
  return JSON.parse(data);
};

// Function to write items to the JSON file
const writeItemsToFile = (items) => {
  fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2));
};

// Middleware for API key authentication
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['api-key'];

  if (!apiKey) {
    return res.status(401).send('Unauthorized: API key is missing');
  }

  // Validate the API key (You may have a predefined API key or a list of valid API keys)
  if (apiKey !== 'YOUR_API_KEY') {
    return res.status(403).send('Forbidden: Invalid API key');
  }

  next();
};

// Create user endpoint
app.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).send('Bad Request: Username, password, and role are required');
  }

  const users = readUsersFromFile();
  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    return res.status(409).send('Conflict: User with the same username already exists');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    role,
  };

  users.push(newUser);
  writeUsersToFile(users);

  res.status(201).json({ message: 'User created successfully', user: newUser });
});

// Authenticate user endpoint
app.post('/api/authenticate', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Bad Request: Username and password are required');
  }

  const users = readUsersFromFile();
  const user = users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send('Unauthorized: Invalid credentials');
  }

  // Generate and send the API key upon successful authentication
  res.json({ message: 'Authentication successful', apiKey: 'YOUR_GENERATED_API_KEY' });
});

// Get all items (accessible only to normal users)
app.get('/api/items', apiKeyAuth, (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).send('Bad Request: Username is required');
  }

  const users = readUsersFromFile();
  const user = users.find((u) => u.username === username);

  if (!user || user.role !== 'normal') {
    return res.status(403).send('Forbidden: Access denied');
  }

  const items = readItemsFromFile();
  res.json(items);
});

// Create item (accessible only to admin users)
app.post('/api/items', apiKeyAuth, (req, res) => {
  const { username, name, price, size } = req.body;

  if (!username || !name || !price || !size) {
    return res.status(400).send('Bad Request: Username, name, price, and size are required');
  }

  const users = readUsersFromFile();
  const user = users.find((u) => u.username === username);

  if (!user || user.role !== 'admin') {
    return res.status(403).send('Forbidden: Access denied');
  }

  const newItem = {
    id: uuidv4(),
    name,
    price,
    size,
  };

  const items = readItemsFromFile();
  items.push(newItem);
  writeItemsToFile(items);

  res.status(201).json(newItem);
});

// Update item (accessible only to admin users)
app.put('/api/items/:id', apiKeyAuth, (req, res) => {
  // Similar authorization logic as create item...

  // Update item logic...
});

// Delete item (accessible only to admin users)
app.delete('/api/items/:id', apiKeyAuth, (req, res) => {
  // Similar authorization logic as create item...

  // Delete item logic...
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
