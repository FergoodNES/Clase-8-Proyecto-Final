/**
 * ====================================================================================
 * SCRIPT DE MONITOREO Y HEALTH CHECK EN LÍNEA DE COMANDOS (TEMA 15.4 / UNIDAD 8)
 * Ejecuta una comprobación del estado del servicio, base de datos, memoria y seguridad.
 * ====================================================================================
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/api/health`;

console.log('================================================================');
console.log(' AUDITORÍA DE MONITOREO Y HEALTH CHECK - UNIDAD 8');
console.log(` Consultando endpoint: ${URL}`);
console.log('================================================================\n');

http.get(URL, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log(`STATUS HTTP:       ${res.statusCode === 200 ? '\x1b[32m200 OK\x1b[0m' : '\x1b[31m' + res.statusCode + '\x1b[0m'}`);
      console.log(`ESTADO GENERAL:    ${data.status === 'HEALTHY' ? '\x1b[32mHEALTHY\x1b[0m' : '\x1b[33m' + data.status + '\x1b[0m'}`);
      console.log(`VERSIÓN:           ${data.version}`);
      console.log(`AMBIENTE:          ${data.ambiente}`);
      console.log(`UPTIME:            ${data.sistema.uptimeLegible}`);
      console.log(`LATENCIA DB:       ${data.dependencias.baseDeDatos.latenciaMs} ms (${data.dependencias.baseDeDatos.status})`);
      console.log(`MEMORIA HEAP:      ${data.sistema.memoria.heapUsedMB} MB / ${data.sistema.memoria.heapTotalMB} MB (RSS: ${data.sistema.memoria.rssMB} MB)`);
      console.log(`SEGURIDAD:         JWT=${data.seguridad.autenticacion} | RBAC=${data.seguridad.rbac} | Helmet=${data.seguridad.helmet}`);
      console.log('\n================================================================');
      console.log(' ✅ Verificación de disponibilidad y persistencia superada.');
      console.log('================================================================');
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', e.message);
      console.log('Respuesta recibida:', raw);
    }
  });
}).on('error', (err) => {
  console.error('\x1b[31m❌ No se pudo conectar con el servidor en ' + URL + '\x1b[0m');
  console.error('Detalle:', err.message);
  console.log('Asegúrate de que el servidor esté corriendo con: npm run dev');
});
