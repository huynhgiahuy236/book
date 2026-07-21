import mongoose from 'mongoose';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim() || 'CapstoneBook Admin';

if (!uri) {
  throw new Error('Cần DATABASE_URL hoặc MONGODB_URI trong môi trường hiện tại.');
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Cần ADMIN_EMAIL hợp lệ. Ví dụ: ADMIN_EMAIL=you@example.com npm run promote:admin');
}

const connection = await mongoose.createConnection(uri).asPromise();

try {
  const db = connection.db;
  if (!db) throw new Error('Không thể mở database MongoDB.');

  const now = new Date();
  const result = await db.collection('users').findOneAndUpdate(
    { email },
    {
      $set: { role: 'ADMIN', status: 'ACTIVE', updatedAt: now },
      $setOnInsert: {
        name,
        email,
        passwordHash: null,
        provider: 'GOOGLE',
        googleId: null,
        avatarUrl: null,
        emailVerified: false,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!result) throw new Error('Không thể tạo hoặc nâng quyền tài khoản admin.');
  console.log(`Đã cấp quyền ADMIN cho ${email}. Hãy đăng xuất và đăng nhập lại.`);
} finally {
  await connection.close();
}
