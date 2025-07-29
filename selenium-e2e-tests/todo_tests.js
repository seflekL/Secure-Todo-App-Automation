const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const axios = require('axios');

const API_URL = 'http://localhost:5000';

describe('Secure Todo App E2E Tests', function () {
    this.timeout(30000);
    let driver;

    before(async function () {
        console.log('GLOBAL SETUP: Launching browser once for all tests...');
        driver = await new Builder().forBrowser('chrome').build();
        console.log('GLOBAL SETUP: Browser launched.');
    });

    after(async function () {
        console.log('GLOBAL TEARDOWN: All tests completed. Performing final cleanup and closing browser...');
        try {
            await axios.post(`${API_URL}/reset-todos`);
            console.log('GLOBAL TEARDOWN: Backend todos successfully reset after all tests.');
        } catch (error) {
            console.error('GLOBAL TEARDOWN: Error resetting todos after all tests:', error.message);
        }
        if (driver) {
            await driver.quit();
            console.log('GLOBAL TEARDOWN: Browser successfully closed.');
        }
    });

    beforeEach(async function () {
        console.log('BEFORE EACH: Starting per-test setup (resetting backend and navigating to app)...');
        console.log('BEFORE EACH: Target URL for React app: http://localhost:3000');

        try {
            console.log('BEFORE EACH: Calling API to reset backend todos...');
            await axios.post(`${API_URL}/reset-todos`);
            console.log('BEFORE EACH: Backend todos successfully reset.');
        } catch (error) {
            console.error('BEFORE EACH: Error resetting backend todos:', error.message);
            throw new Error('Failed to reset backend todos, skipping tests.');
        }

        console.log('BEFORE EACH: Navigating to React application (http://localhost:3000)...');
        await driver.get('http://localhost:3000');
        console.log('BEFORE EACH: Page successfully loaded (driver.get completed).');

        console.log('BEFORE EACH: Waiting for app title element (id="app-title")....');
        await driver.wait(until.elementLocated(By.id('app-title')), 10000);
        console.log('BEFORE EACH: App title found. Page ready for interaction.');
    });

    afterEach(async function () {
        console.log('AFTER EACH: Cleaning up after test (no browser close).');
    });

    it('should allow user to login with valid credentials', async function () {
        console.log('TEST: Starting valid login test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');

        await driver.findElement(By.id('login-button')).click();

        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);
        const welcomeMessage = await driver.findElement(By.id('welcome-message')).getText();

        expect(welcomeMessage).to.include('Welcome!');
        console.log('TEST: Valid login test PASSED.');
    });

    it('should not allow user to login with invalid credentials', async function () {
        console.log('TEST: Starting invalid login test...');
        await driver.findElement(By.id('username')).sendKeys('wronguser');
        await driver.findElement(By.id('password')).sendKeys('wrongpassword');

        await driver.findElement(By.id('login-button')).click();

        await driver.wait(until.elementLocated(By.id('login-message')), 10000);
        const errorMessage = await driver.findElement(By.id('login-message')).getText();

        expect(errorMessage).to.include('Invalid username or password.');
        console.log('TEST: Invalid login test PASSED.');
    });

    it('should allow a logged-in user to create a new todo item', async function () {
        console.log('TEST: Starting todo creation test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);

        const newTodoInput = await driver.findElement(By.id('new-todo-input'));
        await newTodoInput.sendKeys('My first todo item', Key.RETURN);

        await driver.wait(until.elementLocated(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='My first todo item']]`)), 10000);
        const todoItem = await driver.findElement(By.xpath("//li[contains(@id, 'todo-item-') and .//span[text()='My first todo item']]"));

        expect(await todoItem.isDisplayed()).to.be.true;
        expect(await todoItem.getText()).to.include('My first todo item');
        console.log('TEST: Todo creation test PASSED.');
    });

    it('should allow a logged-in user to edit an existing todo item', async function () {
        console.log('TEST: Starting todo editing test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);

        const newTodoInput = await driver.findElement(By.id('new-todo-input'));
        const addTodoButton = await driver.findElement(By.id('add-todo-button'));
        const originalTodoText = 'Original Todo Text';
        await newTodoInput.sendKeys(originalTodoText);
        await addTodoButton.click();
        await driver.wait(until.elementLocated(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${originalTodoText}']]`)), 10000);

        const todoItem = await driver.findElement(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${originalTodoText}']]`));
        const todoIdPart = (await todoItem.getAttribute('id')).split('-')[2];

        const editButton = await todoItem.findElement(By.id(`edit-todo-button-${todoIdPart}`));
        await editButton.click();

        const editedTodoText = 'Todo Updated';
        const editTodoInput = await driver.wait(until.elementLocated(By.id(`edit-todo-input-${todoIdPart}`)), 5000);
        await editTodoInput.clear();
        await editTodoInput.sendKeys(editedTodoText);

        const saveButton = await todoItem.findElement(By.id(`save-todo-button-${todoIdPart}`));
        await saveButton.click();

        await driver.wait(until.elementLocated(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${editedTodoText}']]`)), 15000);
        const updatedTodoItem = await driver.findElement(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${editedTodoText}']]`));

        expect(await updatedTodoItem.isDisplayed()).to.be.true;
        expect(await updatedTodoItem.getText()).to.include(editedTodoText);
        console.log('TEST: Todo editing test PASSED.');
    });

    it('should allow a logged-in user to delete an existing todo item', async function () {
        console.log('TEST: Starting todo deletion test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);

        const newTodoInput = await driver.findElement(By.id('new-todo-input'));
        const addTodoButton = await driver.findElement(By.id('add-todo-button'));
        const todoText = 'Todo to be deleted';
        await newTodoInput.sendKeys(todoText);
        await addTodoButton.click();
        const addedTodoItem = await driver.wait(until.elementLocated(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${todoText}']]`)), 10000);

        const todoIdPart = (await addedTodoItem.getAttribute('id')).split('-')[2];

        const deleteButton = await addedTodoItem.findElement(By.id(`delete-todo-button-${todoIdPart}`));
        await deleteButton.click();

        await driver.wait(until.stalenessOf(addedTodoItem), 10000);

        await driver.wait(until.elementLocated(By.id('no-todos-message')), 10000);
        const noTodosMessage = await driver.findElement(By.id('no-todos-message')).getText();

        expect(noTodosMessage).to.include('No todos yet. Add one!');
        console.log('TEST: Todo deletion test PASSED.');
    });

    it('should confirm the existence of expected data after actions (e.g. after adding multiple items)', async function () {
        console.log('TEST: Starting multi-item add and verification test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);

        const newTodoInput = await driver.findElement(By.id('new-todo-input'));
        const addTodoButton = await driver.findElement(By.id('add-todo-button'));

        const todoTexts = ['Task A', 'Task B', 'Task C'];
        for (const text of todoTexts) {
            await newTodoInput.sendKeys(text);
            await addTodoButton.click();
            await driver.wait(until.elementLocated(By.xpath(`//li[contains(@id, 'todo-item-') and .//span[text()='${text}']]`)), 10000);
            console.log(`TEST: "${text}" added and verified.`);
        }

        const allTodoItems = await driver.findElements(By.css('#todo-list li span'));
        expect(allTodoItems.length).to.equal(todoTexts.length);

        for (let i = 0; i < todoTexts.length; i++) {
            expect(await allTodoItems[i].getText()).to.equal(todoTexts[i]);
        }
        console.log('TEST: Multi-item add and verification test PASSED.');
    });

    it('should allow user to logout and return to login screen', async function () {
        console.log('TEST: Starting logout test...');
        await driver.findElement(By.id('username')).sendKeys('testuser');
        await driver.findElement(By.id('password')).sendKeys('password123');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.elementLocated(By.id('welcome-message')), 10000);

        await driver.findElement(By.id('logout-button')).click();

        await driver.wait(until.elementLocated(By.id('login-button')), 10000);
        const loginButton = await driver.findElement(By.id('login-button'));

        expect(await loginButton.isDisplayed()).to.be.true;
        console.log('TEST: Logout test PASSED.');
    });
});
