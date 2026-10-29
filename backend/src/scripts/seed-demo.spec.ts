import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { assertDemoSeedAllowed, DEMO_ACCOUNTS, seedDemoAccounts } from './seed-demo';
import {
  Category,
  CategoryDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
  ProviderProfile,
  ProviderServiceOffering,
} from '../database/schemas';
import { seedCanonicalCatalog } from './seed-catalog';

describe('Development demo seed isolation and idempotency', () => {
  let app: INestApplicationContext;
  let connection: Connection;
  const database = `fixmate_test_demo_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const mongoUri = `mongodb://127.0.0.1:27017/${database}`;
  const passwords = {
    ADMIN: `Aa!1-${randomBytes(24).toString('base64url')}`,
    CUSTOMER: `Bb!2-${randomBytes(24).toString('base64url')}`,
    PROVIDER: `Cc!3-${randomBytes(24).toString('base64url')}`,
  };
  const input = { nodeEnv: 'test', optIn: 'true', mongoUri, passwords };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_ACCESS_SECRET = randomBytes(32).toString('hex');
    process.env.CORS_ORIGINS = 'http://localhost:4200';
    const { AppModule } = await import('../app.module');
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    connection = app.get<Connection>(getConnectionToken());
    expect(connection.name).toBe(database);
    await seedCanonicalCatalog(
      app.get<Model<CategoryDocument>>(getModelToken(Category.name)),
      app.get<Model<ServiceDocument>>(getModelToken(Service.name)),
    );
  });
  afterAll(async () => {
    // Only this freshly generated, isolated test database can be cleaned up.
    if (connection?.name === database && database.startsWith('fixmate_test_demo_'))
      await connection.dropDatabase();
    await app?.close();
  });

  it('refuses missing opt-in, production even with opt-in, and non-local/non-development targets', () => {
    expect(() => assertDemoSeedAllowed({ ...input, optIn: undefined })).toThrow('opt in');
    expect(() => assertDemoSeedAllowed({ ...input, nodeEnv: 'production' })).toThrow('production');
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => assertDemoSeedAllowed(input)).toThrow('production');
    } finally {
      process.env.NODE_ENV = original;
    }
    for (const uri of [
      'mongodb://remote.example/fixmate',
      'mongodb+srv://localhost/fixmate',
      'mongodb://127.0.0.1/production',
      'mongodb://127.0.0.1/fixmate_production',
    ]) {
      expect(() => assertDemoSeedAllowed({ ...input, mongoUri: uri })).toThrow();
    }
  });

  it('persists real hashed accounts, approves onboarding and repeats without duplicates or resetting edits', async () => {
    const first = await seedDemoAccounts(input, app);
    const users = app.get<Model<UserDocument>>(getModelToken(User.name));
    const profileModel = app.get<Model<ProviderProfile>>(getModelToken(ProviderProfile.name));
    const offeringModel = app.get<Model<ProviderServiceOffering>>(
      getModelToken(ProviderServiceOffering.name),
    );
    expect(first.accounts.every((a) => a.created)).toBe(true);
    for (const account of DEMO_ACCOUNTS) {
      const user = await users.findOne({ email: account.email }).select('+passwordHash').orFail();
      expect(user.role).toBe(account.role);
      expect(user.passwordHash).not.toBe(passwords[account.key]);
      expect(bcrypt.getRounds(user.passwordHash)).toBe(12);
      expect(await bcrypt.compare(passwords[account.key], user.passwordHash)).toBe(true);
    }
    const profile = await profileModel.findById(first.provider.id).orFail();
    expect(profile.approvalStatus).toBe('APPROVED');
    expect(profile.reviewCount).toBe(0);
    expect(profile.averageRating).toBe(0);
    expect(profile.approvalMetadata.reviewedByUserId?.toString()).toBe(first.accounts[0].id);
    await profileModel.updateOne(
      { _id: profile._id },
      { $set: { displayName: 'Demo provider edited during development' } },
    );
    const second = await seedDemoAccounts(input, app);
    expect(second.accounts.map((a) => a.id)).toEqual(first.accounts.map((a) => a.id));
    expect(second.accounts.every((a) => !a.created)).toBe(true);
    expect(await users.countDocuments({ email: { $in: DEMO_ACCOUNTS.map((a) => a.email) } })).toBe(
      3,
    );
    expect(await profileModel.countDocuments()).toBe(1);
    expect(await offeringModel.countDocuments()).toBe(1);
    expect((await profileModel.findById(profile._id).orFail()).displayName).toBe(
      'Demo provider edited during development',
    );
    await expect(
      seedDemoAccounts(
        {
          ...input,
          passwords: { ...passwords, CUSTOMER: `Zz!9-${randomBytes(24).toString('base64url')}` },
        },
        app,
      ),
    ).rejects.toThrow('nothing will be reset');
    expect(await users.countDocuments()).toBe(3);
  }, 30000);
});
