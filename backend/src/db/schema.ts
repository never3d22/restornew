import {
  mysqlTable,
  varchar,
  text,
  int,
  datetime,
  boolean,
  decimal
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  description: text("description")
});

export const dishes = mysqlTable("dishes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  isAvailable: boolean("is_available").default(true).notNull(),
  categoryId: int("category_id").notNull().references(() => categories.id)
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 191 })
});

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull().references(() => customers.id),
  label: varchar("label", { length: 191 }).notNull(),
  street: varchar("street", { length: 191 }).notNull(),
  city: varchar("city", { length: 191 }).notNull(),
  entrance: varchar("entrance", { length: 32 }),
  floor: varchar("floor", { length: 32 }),
  apartment: varchar("apartment", { length: 32 })
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull().references(() => customers.id),
  addressId: int("address_id").references(() => addresses.id),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: datetime("created_at").notNull().defaultNow(),
  updatedAt: datetime("updated_at").notNull().defaultNow()
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id),
  dishId: int("dish_id").notNull().references(() => dishes.id),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull()
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  dishes: many(dishes)
}));

export const dishesRelations = relations(dishes, ({ one }) => ({
  category: one(categories, {
    fields: [dishes.categoryId],
    references: [categories.id]
  })
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders)
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id]
  }),
  orders: many(orders)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id]
  })
}));
