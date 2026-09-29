const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running NEXUS Backend Production Build on Render...');

const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');
const frontendDir = path.join(rootDir, 'frontend');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || Boolean(process.env.RENDER);

// 1. Auto-switch to PostgreSQL if deployed on Render or postgres URL provided
if (isPostgres) {
  console.log('📦 PostgreSQL detected. Configuring production PostgreSQL schema...');
  const pgSchema = path.join(backendDir, 'prisma', 'schema.postgresql.prisma');
  const targetSchema = path.join(backendDir, 'prisma', 'schema.prisma');
  if (fs.existsSync(pgSchema)) {
    fs.copyFileSync(pgSchema, targetSchema);
    console.log('✅ Switched schema.prisma to PostgreSQL provider.');
  }
} else {
  console.log('ℹ️ Using local/default database configuration.');
}

function run(cmd, cwd) {
  console.log(`\n▶️ Executing: ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

try {
  // 2. Generate Prisma Client
  run('npx prisma generate', backendDir);

  // 3. If connected to a live PostgreSQL DB, push tables and seed demo data
  if (isPostgres && dbUrl) {
    console.log('🗄️ Synchronizing PostgreSQL schema with database...');
    try {
      run('npx prisma db push --accept-data-loss', backendDir);
      console.log('🌱 Seeding initial demo accounts and projects...');
      run('npx tsx prisma/seed.ts', backendDir);
    } catch (dbErr) {
      console.warn('⚠️ DB push/seed warning (continuing build):', dbErr.message);
    }
  }

  // 4. Compile backend TypeScript
  console.log('🔨 Compiling backend TypeScript...');
  run('npx tsc', backendDir);

  // 5. If frontend exists, build it so backend can serve the web interface
  if (fs.existsSync(frontendDir)) {
    console.log('🎨 Building React frontend for unified serving...');
    try {
      run('npm --prefix ../frontend install', backendDir);
      run('npm --prefix ../frontend run build', backendDir);
    } catch (frontErr) {
      console.warn('⚠️ Frontend build warning:', frontErr.message);
    }
  }

  console.log('\n🎉 NEXUS Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
}
