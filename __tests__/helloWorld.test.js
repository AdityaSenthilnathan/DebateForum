// __tests__/helloWorld.test.js
const helloWorld = require('../lib/helloWorld');

describe('helloWorld', () => {
    test('returns "Hello, World!"', () => {
        expect(helloWorld()).toBe('Hello, World!');
    });
});