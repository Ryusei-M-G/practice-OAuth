import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
});

// 接続チェック関数
export const checkConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
};

// ユーザー追加・更新関数
export const upsertUser = async (userInfo) => {
  try {
    const { id, email, name } = userInfo;

    const query = `
      INSERT INTO users (google_id, email, name, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (google_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name
      RETURNING *;
    `;

    const result = await pool.query(query, [id, email, name]);
    console.log('User saved to database:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Database save error:', error.message);
    throw error;
  }
};

export default pool;