const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running database migrations...');

try {
  // TypeORM CLI'yi çalıştır
  execSync('npm run typeorm -- migration:run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  });
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  // Migration hatası olsa bile uygulamayı başlat (belki migration zaten çalıştırılmış)
  console.log('⚠️  Continuing with application startup...');
}
