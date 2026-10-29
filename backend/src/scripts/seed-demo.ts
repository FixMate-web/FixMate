import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { Connection, Model } from 'mongoose';
import { AccountStatus, ProviderApprovalStatus, UserRole } from '../common/domain';
import { AuthenticatedUser } from '../common/auth';
import {
  Category,
  CategoryDocument,
  Service,
  ServiceDocument,
  User,
  UserDocument,
} from '../database/schemas';
import { AuthService } from '../modules/auth/auth.service';
import { ProvidersService } from '../modules/providers/providers.service';
import { bootstrapAdminAccount } from './bootstrap-admin';

export const DEMO_ACCOUNTS = [
  {
    key: 'ADMIN',
    email: 'admin.demo@fixmate.test',
    role: UserRole.ADMIN,
    fullName: 'FixMate Demo Administrator',
  },
  {
    key: 'CUSTOMER',
    email: 'customer.demo@fixmate.test',
    role: UserRole.CUSTOMER,
    fullName: 'FixMate Demo Customer',
  },
  {
    key: 'PROVIDER',
    email: 'provider.demo@fixmate.test',
    role: UserRole.PROVIDER,
    fullName: 'FixMate Demo Maintenance Provider',
  },
] as const;
type DemoKey = (typeof DEMO_ACCOUNTS)[number]['key'];
export interface DemoSeedInput {
  nodeEnv: string;
  optIn: string | undefined;
  mongoUri: string;
  passwords: Record<DemoKey, string>;
}

export function assertDemoSeedAllowed(
  input: Pick<DemoSeedInput, 'nodeEnv' | 'optIn' | 'mongoUri'>,
) {
  if (process.env.NODE_ENV === 'production' || !['development', 'test'].includes(input.nodeEnv)) {
    throw new Error(
      'Demo accounts are restricted to development/test; production is always forbidden.',
    );
  }
  if (input.optIn !== 'true')
    throw new Error('Set ALLOW_DEMO_ACCOUNT_SEED=true to explicitly opt in.');
  const uri = new URL(input.mongoUri);
  const database = uri.pathname.slice(1);
  if (
    uri.protocol !== 'mongodb:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname) ||
    uri.username ||
    uri.password ||
    uri.search ||
    !/^fixmate(?:_(?:dev|development|test)(?:_[a-z0-9_]+)?)?$/.test(database)
  ) {
    throw new Error(
      'Demo seeding requires a loopback MongoDB and a FixMate development/test database.',
    );
  }
  return database;
}

export async function seedDemoAccounts(input: DemoSeedInput, app: INestApplicationContext) {
  const database = assertDemoSeedAllowed(input);
  const actualEnv = app.get(ConfigService).get<string>('NODE_ENV');
  if (!actualEnv || !['development', 'test'].includes(actualEnv))
    throw new Error('Application environment is not development/test.');
  const connection = app.get<Connection>(getConnectionToken());
  if (
    connection.name !== database ||
    !['localhost', '127.0.0.1', '::1'].includes(connection.host)
  ) {
    throw new Error('The connected application database does not match the local seed target.');
  }
  const values = Object.values(input.passwords);
  if (
    values.length !== 3 ||
    new Set(values).size !== 3 ||
    values.some(
      (p) =>
        !p ||
        p.length < 20 ||
        Buffer.byteLength(p) > 72 ||
        !/[a-z]/.test(p) ||
        !/[A-Z]/.test(p) ||
        !/[0-9]/.test(p) ||
        !/[^a-zA-Z0-9]/.test(p),
    )
  ) {
    throw new Error(
      'Supply three distinct strong passwords, 20–72 bytes, with upper/lowercase, digits and symbols.',
    );
  }
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const services = app.get<Model<ServiceDocument>>(getModelToken(Service.name));
  const categories = app.get<Model<CategoryDocument>>(getModelToken(Category.name));
  const service = await services.findOne({ slug: 'water-leak-detection-repair', isActive: true });
  if (
    !service?.pricingPolicy ||
    !(await categories.exists({ _id: service.categoryId, isActive: true }))
  ) {
    throw new Error(
      'Seed the existing catalog first: npm run seed:catalog. An active priced plumbing service is required.',
    );
  }
  // Preflight every existing account before writing anything. Never change roles,
  // reset passwords, reactivate accounts, or overwrite a colliding user's profile.
  const existing = new Map<DemoKey, UserDocument>();
  for (const account of DEMO_ACCOUNTS) {
    const user = await users.findOne({ email: account.email }).select('+passwordHash');
    if (!user) continue;
    if (
      user.role !== account.role ||
      user.status !== AccountStatus.ACTIVE ||
      !(await bcrypt.compare(input.passwords[account.key], user.passwordHash))
    ) {
      throw new Error(
        `Existing ${account.key} demo account conflicts with the requested role, status or credentials; nothing will be reset.`,
      );
    }
    existing.set(account.key, user);
  }
  const auth = app.get(AuthService);
  const providers = app.get(ProvidersService);
  await bootstrapAdminAccount({
    mongoUri: input.mongoUri,
    nodeEnv: input.nodeEnv,
    email: DEMO_ACCOUNTS[0].email,
    password: input.passwords.ADMIN,
    fullName: DEMO_ACCOUNTS[0].fullName,
    allowProductionBootstrap: false,
  });
  const actors = {} as Record<DemoKey, AuthenticatedUser>;
  for (const account of DEMO_ACCOUNTS) {
    const credentials = { email: account.email, password: input.passwords[account.key] };
    const session =
      account.role !== UserRole.ADMIN && !existing.has(account.key)
        ? await auth.register({ ...credentials, fullName: account.fullName, role: account.role })
        : await auth.login(credentials);
    actors[account.key] = session.user;
    // Do not leave active refresh sessions behind from the provisioning process.
    await auth.logout(session.refreshCookieValue);
  }
  let profile = await providers.getMyProfile(actors.PROVIDER);
  if (
    [ProviderApprovalStatus.REJECTED, ProviderApprovalStatus.SUSPENDED].includes(
      profile.approvalStatus,
    )
  ) {
    throw new Error(
      'Demo profile was moderated; use the existing admin workflow instead of silently overriding that decision.',
    );
  }
  if (profile.approvalStatus === ProviderApprovalStatus.DRAFT) {
    profile = await providers.updateMyProfile(actors.PROVIDER, {
      displayName: 'FixMate Demo Maintenance — TEST ONLY',
      bio: {
        en: 'Local development demonstration provider. Not a real professional; do not place real service requests.',
        ar: 'مزود تجريبي للتطوير المحلي فقط، وليس فنياً حقيقياً. يرجى عدم إرسال طلبات خدمات فعلية.',
      },
      yearsOfExperience: 0,
      coverageGovernorates: ['Amman'],
      coverageAreas: ['Development demo area — Amman'],
      weeklyAvailability: [0, 1, 2, 3, 4].map((dayOfWeek) => ({
        dayOfWeek,
        startMinuteOfDay: 540,
        endMinuteOfDay: 1020,
      })),
    });
  }
  const offerings = await providers.getMyServices(actors.PROVIDER);
  if (!offerings.some((o) => o.serviceId === service.id)) {
    await providers.upsertMyService(actors.PROVIDER, {
      serviceId: service.id,
      pricingType: service.pricingPolicy.pricingType,
      priceAmountFils: service.pricingPolicy.indicativeAmountFils,
      estimatedDurationMinutes: service.defaultDurationMinutes,
      isEnabled: true,
    });
  }
  if (profile.approvalStatus === ProviderApprovalStatus.DRAFT)
    profile = await providers.submitForReview(actors.PROVIDER);
  if (profile.approvalStatus !== ProviderApprovalStatus.APPROVED) {
    await providers.updateProviderApproval(actors.ADMIN, profile.id, {
      status: ProviderApprovalStatus.APPROVED,
      verificationNotes:
        'Local development demo only. No real identity, licensing or workmanship verification claimed.',
    });
  }
  return {
    database,
    accounts: DEMO_ACCOUNTS.map((a) => ({
      email: a.email,
      role: a.role,
      id: actors[a.key].id,
      created: !existing.has(a.key),
    })),
    provider: {
      id: profile.id,
      approvalStatus: ProviderApprovalStatus.APPROVED,
      serviceSlug: service.slug,
    },
  };
}

async function runCli() {
  const backend = resolve(__dirname, '../..');
  const baseFile = resolve(backend, '.env');
  const env = {
    ...(existsSync(baseFile) ? parseEnv(readFileSync(baseFile, 'utf8')) : {}),
    ...process.env,
  };
  const input = {
    nodeEnv: env.NODE_ENV || '',
    optIn: env.ALLOW_DEMO_ACCOUNT_SEED,
    mongoUri: env.MONGODB_URI || '',
  };
  // Refuse before writing credentials, opening MongoDB or importing AppModule.
  assertDemoSeedAllowed(input);
  const recordPath = resolve(backend, '.env.demo.local');
  const stored = existsSync(recordPath) ? parseEnv(readFileSync(recordPath, 'utf8')) : {};
  const passwords = {} as Record<DemoKey, string>;
  for (const a of DEMO_ACCOUNTS)
    passwords[a.key] =
      env[`DEMO_${a.key}_PASSWORD`] ||
      stored[`DEMO_${a.key}_PASSWORD`] ||
      `Fm!A1-${randomBytes(24).toString('base64url')}`;
  const record =
    '# LOCAL DEVELOPMENT ONLY — git-ignored; never deploy or share this file.\n' +
    DEMO_ACCOUNTS.map(
      (a) => `DEMO_${a.key}_EMAIL=${a.email}\nDEMO_${a.key}_PASSWORD=${passwords[a.key]}\n`,
    ).join('\n');
  if (!existsSync(recordPath)) writeFileSync(recordPath, record, { mode: 0o600, flag: 'wx' });
  chmodSync(recordPath, 0o600);
  Object.assign(process.env, env);
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../app.module');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const result = await seedDemoAccounts({ ...input, passwords }, app);
    writeFileSync(recordPath, record, { mode: 0o600 });
    console.log(JSON.stringify({ ...result, credentialsFile: recordPath }));
  } finally {
    await app.close();
  }
}

if (require.main === module)
  runCli().catch(() => {
    console.error(
      '[seed:demo] Failed. Check local environment, opt-in, catalog and existing-account credentials/roles. No passwords were reset.',
    );
    process.exitCode = 1;
  });
