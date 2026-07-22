import mongoose from 'mongoose';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri)
  throw new Error(
    'Cần DATABASE_URL hoặc MONGODB_URI trong môi trường hiện tại.',
  );

const connection = await mongoose.createConnection(uri).asPromise();
try {
  const db = connection.db;
  if (!db) throw new Error('Không thể mở database MongoDB.');
  const result = await db.collection('books').updateOne(
    { slug: 'dac-nhan-tam' },
    {
      $set: {
        ebookFile: {
          originalFileName: 'Dac Nhan Tam.pdf',
          objectKey: 'ebooks/Dac Nhan Tam.pdf',
          storageProvider: 'R2',
          mimeType: 'application/pdf',
          status: 'READY',
        },
        readingEnabled: true,
        updatedAt: new Date(),
      },
    },
  );
  if (!result.matchedCount) {
    throw new Error(
      'Không tìm thấy sách có slug dac-nhan-tam; không tạo document mới.',
    );
  }
  console.log('Đã bổ sung metadata R2 cho document Đắc Nhân Tâm hiện có.');
} finally {
  await connection.close();
}
