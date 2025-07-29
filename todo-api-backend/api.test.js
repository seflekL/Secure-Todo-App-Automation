const request = require('supertest');
const app = require('./app');

let authToken = '';
let createdItemId = '';

describe('API Test Automation: Todo Application Backend', () => {
    beforeAll(async () => {
        console.log('Starting API Tests: Resetting backend and logging in...');

        app.set('items', [
            { id: 'initialItem1', name: 'Existing Items - Task 1', completed: false },
            { id: 'initialItem2', name: 'Existing Items - Task 2', completed: true }
        ]);
        app.set('nextItemId', 3);

        const loginRes = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(loginRes.statusCode).toEqual(200);
        expect(loginRes.body).toHaveProperty('token');
        authToken = loginRes.body.token;
        console.log(`Login successful. Token received: ${authToken.substring(0, 10)}...`);
    });

    afterEach(() => {
    });

    describe('POST /login: User Authentication', () => {
        it('should allow user to login with valid credentials (positive scenario)', async () => {
            const res = await request(app)
                .post('/login')
                .send({ username: 'testuser', password: 'password123' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.message).toEqual('Login successful');
            expect(res.body.token).not.toBeNull();
            console.log('Login test successful: Valid credentials.');
        });

        it('should not allow user to login with invalid password (negative scenario)', async () => {
            const res = await request(app)
                .post('/login')
                .send({ username: 'testuser', password: 'wrongpassword' });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid credentials');
            expect(res.body).not.toHaveProperty('token');
            console.log('Login test successful: Invalid password.');
        });

        it('should not allow user to login with invalid username (negative scenario)', async () => {
            const res = await request(app)
                .post('/login')
                .send({ username: 'unknownuser', password: 'password123' });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid credentials');
            console.log('Login test successful: Invalid username.');
        });

        it('should return 401 for missing credentials (negative scenario)', async () => {
            const res = await request(app)
                .post('/login')
                .send({});

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Invalid credentials');
            console.log('Login test successful: Missing credentials.');
        });
    });

    describe('GET /items: Listing All Items', () => {
        it('should successfully retrieve all items for an authenticated user (positive scenario)', async () => {
            const res = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThanOrEqual(2);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('completed');
            console.log('GET items test successful: Items retrieved successfully.');
        });

        it('should return 401 if no authorization token is provided (negative scenario)', async () => {
            const res = await request(app).get('/items');

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Authorization token required');
            console.log('GET items test successful: No token provided.');
        });

        it('should return 403 if an invalid authorization token is provided (negative scenario)', async () => {
            const res = await request(app)
                .get('/items')
                .set('Authorization', `Bearer invalid-token`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Invalid or expired token');
            console.log('GET items test successful: Invalid token.');
        });
    });

    describe('POST /items: Creating New Item', () => {
        it('should create a new item for an authenticated user (positive scenario)', async () => {
            const newItem = { name: 'New task with Supertest', completed: false };
            const res = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newItem);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toEqual(newItem.name);
            expect(res.body.completed).toEqual(newItem.completed);
            createdItemId = res.body.id;
            console.log(`POST items test successful: New item created. ID: ${createdItemId}`);
        });

        it('should return 400 if item name is missing (negative scenario)', async () => {
            const res = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ completed: false });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('Item name is required');
            console.log('POST items test successful: Missing item name.');
        });

        it('should return 401 if no authorization token is provided (negative scenario)', async () => {
            const res = await request(app)
                .post('/items')
                .send({ name: 'Unauthorized task' });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Authorization token required');
            console.log('POST items test successful: No token provided.');
        });
    });

    describe('PUT /items/:id: Updating Item', () => {
        let itemToUpdateId;

        beforeAll(async () => {
            const createRes = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Task to be updated', completed: false });
            itemToUpdateId = createRes.body.id;
        });

        it('should successfully update an existing item for an authenticated user (positive scenario)', async () => {
            const updatedData = { name: 'Updated Task Name', completed: true };
            const res = await request(app)
                .put(`/items/${itemToUpdateId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatedData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toEqual(itemToUpdateId);
            expect(res.body.name).toEqual(updatedData.name);
            expect(res.body.completed).toEqual(updatedData.completed);

            const getRes = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`);
            const updatedItemInDb = getRes.body.find(item => item.id === itemToUpdateId);
            expect(updatedItemInDb.name).toEqual(updatedData.name);
            expect(updatedItemInDb.completed).toEqual(updatedData.completed);
            console.log(`PUT items test successful: Item updated. ID: ${itemToUpdateId}`);
        });

        it('should return 404 when updating a non-existent item (negative scenario)', async () => {
            const res = await request(app)
                .put(`/items/nonExistentId123`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Update non-existent item' });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Item not found');
            console.log('PUT items test successful: Non-existent item.');
        });

        it('should return 400 if no update data is provided (negative scenario)', async () => {
            const res = await request(app)
                .put(`/items/${itemToUpdateId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('No update data provided');
            console.log('PUT items test successful: No update data.');
        });

        it('should return 401 if no authorization token is provided (negative scenario)', async () => {
            const res = await request(app)
                .put(`/items/${itemToUpdateId}`)
                .send({ name: 'Unauthorized Update' });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Authorization token required');
            console.log('PUT items test successful: No token provided.');
        });
    });

    describe('DELETE /items/:id: Deleting Item', () => {
        let itemToDeleteId;

        beforeEach(async () => {
            const createRes = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Task to be deleted', completed: false });
            itemToDeleteId = createRes.body.id;
        });

        it('should successfully delete an existing item for an authenticated user (positive scenario)', async () => {
            const res = await request(app)
                .delete(`/items/${itemToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(204);
            console.log(`DELETE items test successful: Item deleted. ID: ${itemToDeleteId}`);

            const getRes = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`);
            const deletedItem = getRes.body.find(item => item.id === itemToDeleteId);
            expect(deletedItem).toBeUndefined();
        });

        it('should return 404 when deleting a non-existent item (negative scenario)', async () => {
            const res = await request(app)
                .delete(`/items/definitelyNonExistentId123`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Item not found');
            console.log('DELETE items test successful: Non-existent item.');
        });

        it('should return 401 if no authorization token is provided (negative scenario)', async () => {
            const res = await request(app).delete(`/items/${itemToDeleteId}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toEqual('Authorization token required');
            console.log('DELETE items test successful: No token provided.');
        });
    });
});
