const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server:   process.env.DB_SERVER || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'AppleZone',
  authentication: {
    type: 'default',           // SQL Server Authentication (sa login)
    options: {
      userName: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
    },
  },
  options: {
    encrypt:                true,  // mssql v11 yêu cầu encrypt=true
    trustServerCertificate: true,  // bỏ qua cert check cho Docker local
    enableArithAbort:       true,
    connectTimeout:         30000,
    requestTimeout:         30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

/** Lấy connection pool singleton */
async function getPool() {
  if (!pool) {
    try {
      pool = await new sql.ConnectionPool(dbConfig).connect();
      console.log(`✅ Kết nối SQL Server thành công → ${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    } catch (err) {
      pool = null;
      console.error('❌ Lỗi kết nối SQL Server:');
      console.error(`   Server : ${process.env.DB_SERVER}:${process.env.DB_PORT}`);
      console.error(`   DB     : ${process.env.DB_NAME}`);
      console.error(`   User   : ${process.env.DB_USER}`);
      console.error(`   Chi tiết: ${err.message}`);
      throw err;
    }
  }
  return pool;
}

/**
 * Thực thi raw T-SQL với named parameters
 * @param {string} queryStr
 * @param {Object} params  { name: { type: sql.Int, value: 1 } }
 */
async function query(queryStr, params = {}) {
  const p = await getPool();
  const req = p.request();
  for (const [key, { type, value }] of Object.entries(params)) {
    req.input(key, type, value);
  }
  return req.query(queryStr);
}

module.exports = { query, sql, getPool };
