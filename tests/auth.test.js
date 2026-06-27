import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import { register } from '../src/services/userService.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        instance: { launchTimeout: 60000 },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
}, 30000);

describe('Auth Security', () => {
    it('register should not accept isAdmin parameter (privilege escalation prevention)', async () => {
        const user = await register('Test User', 'test@example.com', 'password123');
        
        // Verify the user was created without admin privileges
        const dbUser = await User.findOne({ email: 'test@example.com' });
        expect(dbUser.isAdmin).toBe(false);
    });

    it('register function signature should only accept name, email, password', async () => {
        // The register function should have exactly 3 parameters
        expect(register.length).toBe(3);
    });

    it('register should not allow duplicate emails', async () => {
        await expect(
            register('Another User', 'test@example.com', 'password456')
        ).rejects.toThrow('User already exists');
    });
});
