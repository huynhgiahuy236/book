import mongoose from 'mongoose';

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) throw new Error('Cần DATABASE_URL hoặc MONGODB_URI trong môi trường hiện tại.');

const connection = await mongoose.createConnection(uri).asPromise();
try {
  const db = connection.db;
  if (!db) throw new Error('Không thể mở database MongoDB.');
  const now = new Date();
  await db.collection('books').updateOne(
    { id: 'dac-nhan-tam' },
    {
      $set: {
        id: 'dac-nhan-tam', slug: 'dac-nhan-tam', externalId: 'LOCAL-DAC-NHAN-TAM',
        source: 'LOCAL', sourceUrl: '', title: 'Đắc Nhân Tâm',
        subtitle: 'Nghệ thuật thu phục lòng người', authors: ['Dale Carnegie'],
        publisher: 'CapstoneBook demo', publishedDate: null,
        description: 'Cuốn sách kinh điển về giao tiếp, thấu hiểu con người và xây dựng những mối quan hệ bền vững.',
        isbn10: null, isbn13: null, pageCount: null, language: 'vie',
        categories: ['Kỹ năng sống', 'Phát triển bản thân'], coverUrl: '', previewUrl: '',
        averageRating: 4.9, ratingsCount: 0, format: 'EBOOK', accessType: 'PURCHASE',
        status: 'ACTIVE', readingEnabled: true, premium: false, price: 69000,
        ebookPrice: 69000, physicalPrice: 0, stock: 0, pricingNote: 'DEMO_PRICE_NOT_RETAIL',
        ebookFile: {
          originalFileName: 'dac-nhan-tam.pdf', objectKey: 'dac-nhan-tam.pdf',
          storageProvider: 'LOCAL', mimeType: 'application/pdf', fileSize: 2589665,
        },
        importedAt: now.toISOString(), updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  console.log('Đã upsert metadata Đắc Nhân Tâm.');
} finally {
  await connection.close();
}
