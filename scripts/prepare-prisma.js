const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  const dbUrl = process.env.DATABASE_URL || '';

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('[Prisma Prep] Conexión PostgreSQL detectada. Configurando provider = "postgresql"...');
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma Prep] schema.prisma actualizado exitosamente para PostgreSQL.');
  } else {
    console.log('[Prisma Prep] Conexión SQLite/Local detectada. Configurando provider = "sqlite"...');
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma Prep] schema.prisma verificado para SQLite.');
  }
}
