import fs from 'fs';
import path from 'path';

const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const targetSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (fs.existsSync(postgresSchemaPath)) {
  fs.copyFileSync(postgresSchemaPath, targetSchemaPath);
  console.log('✅ Successfully restored Prisma schema to PostgreSQL mode for production deployment!');
} else {
  console.error('schema.postgresql.prisma not found!');
}
