import mysql from "mysql2/promise";
import { env } from "../env";

const statements = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    description TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(512),
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    category_id INT NOT NULL,
    CONSTRAINT fk_dishes_category FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(191)
  )`,
  `CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    label VARCHAR(191) NOT NULL,
    street VARCHAR(191) NOT NULL,
    city VARCHAR(191) NOT NULL,
    entrance VARCHAR(32),
    floor VARCHAR(32),
    apartment VARCHAR(32),
    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    address_id INT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    total DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    dish_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_items_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
  )`
];

async function migrate() {
  const connection = await mysql.createConnection(env.DATABASE_URL);
  for (const statement of statements) {
    await connection.execute(statement);
  }
  await connection.end();
  console.log("Database schema ensured");
  process.exit(0);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
