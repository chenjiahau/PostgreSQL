const db = require('../database'); // adjust path
const { faker } = require('@faker-js/faker');

(async () => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1) Create table if not exists (with discount fields)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
        discount_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        in_stock BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2) Clean table & reset id sequence
    await client.query(`TRUNCATE TABLE products RESTART IDENTITY;`);

    // 3) Prepare 100 faker rows
    const currencies = ['USD', 'EUR', 'JPY', 'TWD'];
    const rows = Array.from({ length: 100 }, () => {
      const sku = faker.string.alphanumeric({ length: 10 }).toUpperCase();
      const name = faker.commerce.productName();
      const description = faker.commerce.productDescription();
      const price = Number(faker.commerce.price({ min: 3, max: 999, dec: 2 }));

      const discountPercent = Number((Math.random() * 50).toFixed(2)); // 0-50% off
      const discountPrice = Number((price * (1 - discountPercent / 100)).toFixed(2));

      const currency = faker.helpers.arrayElement(currencies);
      const inStock = faker.datatype.boolean({ probability: 0.8 });
      const createdAt = faker.date.past({ years: 1 });
      const updatedAt = faker.date.recent({ days: 30 });

      return [
        sku,
        name,
        description,
        price,
        currency,
        discountPercent,
        discountPrice,
        inStock,
        createdAt,
        updatedAt
      ];
    });

    // 4) Bulk insert
    const colsPerRow = 10;
    const placeholders = rows
      .map((_, i) => {
        const b = i * colsPerRow;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}, $${b + 9}, $${b + 10})`;
      })
      .join(', ');

    const flatValues = rows.flat();

    await client.query(
      `
      INSERT INTO products (
        sku, name, description, price, currency,
        discount_percent, discount_price, in_stock,
        created_at, updated_at
      ) VALUES ${placeholders};
      `,
      flatValues
    );

    await client.query('COMMIT');
    console.log('✅ Products table created & 100 faker rows inserted.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Init/seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
})();