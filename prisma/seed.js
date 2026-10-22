const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de usuarios con hash bcrypt e incidentes protegidos...');

  // Limpiar datos previos
  await prisma.incidente.deleteMany();
  await prisma.usuario.deleteMany();

  // Salt rounds estándar recomendado (Work Factor 10)
  const saltRounds = 10;

  // Hashear contraseñas con bcrypt (nunca almacenar contraseñas en texto plano)
  const hashAdmin = await bcrypt.hash('Admin123*', saltRounds);
  const hashSupervisor = await bcrypt.hash('Supervisor123*', saltRounds);
  const hashAnalista = await bcrypt.hash('Analista123*', saltRounds);

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@plataforma.edu',
      password: hashAdmin,
      nombre: 'Administrador del Sistema',
      rol: 'admin'
    }
  });

  const supervisor = await prisma.usuario.create({
    data: {
      email: 'supervisor@plataforma.edu',
      password: hashSupervisor,
      nombre: 'Ing. Laura Gómez',
      rol: 'supervisor'
    }
  });

  const analista = await prisma.usuario.create({
    data: {
      email: 'analista@plataforma.edu',
      password: hashAnalista,
      nombre: 'Carlos Mendoza (SOC)',
      rol: 'analista'
    }
  });

  console.log('✅ 3 Usuarios registrados con contraseñas cifradas en bcrypt (admin, supervisor, analista).');

  // Insertar incidentes de prueba
  const incidentes = [
    {
      titulo: 'Intento de fuerza bruta contra servicio SSH perimetral',
      descripcion: 'El sistema SIEM detectó más de 850 intentos fallidos de autenticación en el puerto 22 desde la IP 198.51.100.24 en un lapso de 3 minutos.',
      estado: 'EN_PROCESO',
      prioridad: 'CRITICA',
      reportadoPor: analista.nombre,
      asignadoA: supervisor.nombre,
      creadoPorId: analista.id
    },
    {
      titulo: 'Detección de payload SQL Injection en parámetro de búsqueda',
      descripcion: 'El WAF bloqueó una petición sospechosa con patrón \' UNION SELECT null, username, password FROM users -- en el endpoint de búsqueda.',
      estado: 'ABIERTO',
      prioridad: 'ALTA',
      reportadoPor: analista.nombre,
      asignadoA: admin.nombre,
      creadoPorId: analista.id
    },
    {
      titulo: 'Expiración próxima de certificado TLS en pasarela de pagos',
      descripcion: 'El certificado SSL/TLS wildcard *.servicios.local expira en 7 días. Requiere renovación y recarga segura en el reverse proxy.',
      estado: 'EN_PROCESO',
      prioridad: 'MEDIA',
      reportadoPor: supervisor.nombre,
      asignadoA: admin.nombre,
      creadoPorId: supervisor.id
    },
    {
      titulo: 'Actualización y hardening de cabeceras HTTP con Helmet',
      descripcion: 'Se desplegó la política de seguridad Content-Security-Policy y X-Frame-Options en el entorno de pruebas exitosamente.',
      estado: 'RESUELTO',
      prioridad: 'BAJA',
      reportadoPor: admin.nombre,
      asignadoA: admin.nombre,
      creadoPorId: admin.id
    },
    {
      titulo: 'Auditoría de políticas de contraseñas y factores de costo bcrypt',
      descripcion: 'Revisión periódica completada. Se validó que el costo de hash bcrypt esté configurado en 10 rounds mínimos.',
      estado: 'CERRADO',
      prioridad: 'BAJA',
      reportadoPor: supervisor.nombre,
      asignadoA: supervisor.nombre,
      creadoPorId: supervisor.id
    }
  ];

  for (const inc of incidentes) {
    await prisma.incidente.create({ data: inc });
  }

  console.log(`✅ ${incidentes.length} incidentes cargados y asociados a usuarios.`);
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
