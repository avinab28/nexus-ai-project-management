const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running Render Automated Full-Stack Build...');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
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
  // 2. Install backend dependencies and generate Prisma client
  run('npm --prefix backend install', rootDir);
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
  run('npm --prefix backend run build', rootDir);

  // 5. Install frontend dependencies and bundle Vite assets
  run('npm --prefix frontend install', rootDir);
  run('npm --prefix frontend run build', rootDir);

  console.log('\n🎉 Render Full-Stack Build Succeeded!');
} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
}
