import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { AccountStatus, SupportedLanguage, UserRole } from '../common/domain';
import { User, UserSchema } from '../database/schemas';

const BCRYPT_ROUNDS = 12;

export interface BootstrapAdminInput {
  mongoUri: string;
  email: string;
  password: string;
  fullName?: string;
  nodeEnv?: string;
  allowProductionBootstrap?: boolean;
}

export async function bootstrapAdminAccount(
  input: BootstrapAdminInput,
): Promise<{ id: string; email: string; role: UserRole; created: boolean }> {
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production' && !input.allowProductionBootstrap) {
    throw new Error(
      'Admin bootstrap is blocked in production unless ALLOW_PRODUCTION_ADMIN_BOOTSTRAP=true is explicitly set.',
    );
  }

  const normalizedEmail = (input.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address.');
  }

  const password = input.password ?? '';
  if (password.length < 10 || !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    throw new Error(
      'ADMIN_BOOTSTRAP_PASSWORD must be at least 10 characters and include letters and numbers.',
    );
  }

  const fullName = (input.fullName ?? 'FixMate Platform Administrator').trim();

  const conn = await mongoose
    .createConnection(input.mongoUri, { serverSelectionTimeoutMS: 5000 })
    .asPromise();

  try {
    const userModel = conn.model(User.name, UserSchema);
    await userModel.syncIndexes();

    const existing = await userModel.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      if (existing.role !== UserRole.ADMIN) {
        throw new Error(
          `Cannot bootstrap admin: email "${normalizedEmail}" is already registered with role ${existing.role}.`,
        );
      }
      return {
        id: existing._id.toString(),
        email: existing.email,
        role: existing.role,
        created: false,
      };
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const created = await userModel.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      preferredLanguage: SupportedLanguage.AR,
    });

    return {
      id: created._id.toString(),
      email: created.email,
      role: created.role,
      created: true,
    };
  } finally {
    await conn.close();
  }
}

async function runCli(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production.');
  }
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || '';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME || 'FixMate Operations Admin';
  const allowProductionBootstrap =
    process.env.ALLOW_PRODUCTION_ADMIN_BOOTSTRAP === 'true';

  const result = await bootstrapAdminAccount({
    mongoUri,
    email,
    password,
    fullName,
    nodeEnv: process.env.NODE_ENV,
    allowProductionBootstrap,
  });

  console.log(
    JSON.stringify({
      event: 'admin_bootstrap_completed',
      id: result.id,
      email: result.email,
      role: result.role,
      created: result.created,
    }),
  );
}

if (require.main === module) {
  runCli().catch((err: Error) => {
    console.error(process.env.NODE_ENV === 'production'
      ? '[bootstrap-admin] Failed. Check explicit production opt-in, configuration, account conflicts and connectivity.'
      : `[bootstrap-admin] Error: ${err.message}`);
    process.exit(1);
  });
}
