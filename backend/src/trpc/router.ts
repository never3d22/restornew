import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  router,
  publicProcedure,
  authedProcedure,
  adminProcedure
} from "./context";
import {
  categories,
  dishes,
  customers,
  addresses,
  orders,
  orderItems
} from "../db";

export const appRouter = router({
  menu: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.query.categories.findMany({
        with: { dishes: true }
      });
    }),
    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return ctx.db.query.dishes.findMany({
          where: eq(dishes.categoryId, input.categoryId),
          with: { category: true }
        });
      })
  }),
  auth: router({
    requestCode: publicProcedure
      .input(z.object({ phone: z.string().min(10) }))
      .mutation(async ({ input }) => {
        const code = "1234";
        console.log(`SMS code ${code} sent to ${input.phone}`);
        return { success: true, code };
      }),
    verifyCode: publicProcedure
      .input(z.object({ phone: z.string().min(10), code: z.string().min(4) }))
      .mutation(async ({ ctx, input }) => {
        if (input.code !== "1234") {
          throw new Error("Неверный код подтверждения");
        }

        const existing = await ctx.db
          .select()
          .from(customers)
          .where(eq(customers.phone, input.phone));

        if (existing.length > 0) {
          return { customerId: existing[0].id };
        }

        const result = await ctx.db
          .insert(customers)
          .values({ phone: input.phone })
          .execute();

        const customerId = Number(result.insertId);
        return { customerId };
      })
  }),
  addresses: router({
    list: authedProcedure.query(async ({ ctx }) => {
      return ctx.db.query.addresses.findMany({
        where: eq(addresses.customerId, ctx.customerId!)
      });
    }),
    create: authedProcedure
      .input(
        z.object({
          label: z.string().min(3),
          street: z.string().min(3),
          city: z.string().min(2),
          entrance: z.string().optional(),
          floor: z.string().optional(),
          apartment: z.string().optional()
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db
          .insert(addresses)
          .values({
            customerId: ctx.customerId!,
            ...input
          })
          .execute();

        return { id: Number(result.insertId), ...input };
      })
  }),
  cart: router({
    calculateTotal: publicProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              dishId: z.number(),
              quantity: z.number().min(1)
            })
          )
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ids = input.items.map((item) => item.dishId);
        const allDishes = await ctx.db
          .select()
          .from(dishes)
          .where(inArray(dishes.id, ids));

        const total = input.items.reduce((sum, item) => {
          const dish = allDishes.find((d) => d.id === item.dishId);
          if (!dish) return sum;
          return sum + Number(dish.price) * item.quantity;
        }, 0);

        return { total };
      })
  }),
  orders: router({
    create: authedProcedure
      .input(
        z.object({
          addressId: z.number().optional(),
          items: z.array(
            z.object({
              dishId: z.number(),
              quantity: z.number().min(1)
            })
          )
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ids = input.items.map((item) => item.dishId);
        const dbDishes = await ctx.db
          .select()
          .from(dishes)
          .where(inArray(dishes.id, ids));

        if (dbDishes.length !== ids.length) {
          throw new Error("Некоторые блюда недоступны");
        }

        const total = input.items.reduce((sum, item) => {
          const dish = dbDishes.find((d) => d.id === item.dishId)!;
          return sum + Number(dish.price) * item.quantity;
        }, 0);

        const orderResult = await ctx.db
          .insert(orders)
          .values({
            customerId: ctx.customerId!,
            addressId: input.addressId,
            total: total.toFixed(2),
            status: "pending"
          })
          .execute();

        const orderId = Number(orderResult.insertId);

        await ctx.db
          .insert(orderItems)
          .values(
            input.items.map((item) => {
              const dish = dbDishes.find((d) => d.id === item.dishId)!;
              return {
                orderId,
                dishId: dish.id,
                quantity: item.quantity,
                price: dish.price
              };
            })
          )
          .execute();

        return { orderId, total };
      }),
    history: authedProcedure.query(async ({ ctx }) => {
      return ctx.db.query.orders.findMany({
        where: eq(orders.customerId, ctx.customerId!),
        with: {
          items: {
            with: {
              dish: true
            }
          },
          address: true
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)]
      });
    })
  }),
  admin: router({
    createCategory: adminProcedure
      .input(z.object({ name: z.string().min(2), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.insert(categories).values(input).execute();
        return { id: Number(result.insertId), ...input };
      }),
    dishes: adminProcedure
      .input(
        z.object({
          name: z.string().min(2),
          description: z.string().min(2),
          price: z.number().positive(),
          imageUrl: z.string().url().optional(),
          categoryId: z.number(),
          isAvailable: z.boolean().optional().default(true)
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db
          .insert(dishes)
          .values({
            ...input,
            price: input.price.toFixed(2)
          })
          .execute();

        return { id: Number(result.insertId) };
      }),
    updateDish: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).optional(),
          description: z.string().min(2).optional(),
          price: z.number().positive().optional(),
          imageUrl: z.string().url().optional(),
          categoryId: z.number().optional(),
          isAvailable: z.boolean().optional()
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await ctx.db
          .update(dishes)
          .set({
            ...data,
            price: data.price ? data.price.toFixed(2) : undefined
          })
          .where(eq(dishes.id, id))
          .execute();

        return { success: true };
      }),
    orders: adminProcedure.query(async ({ ctx }) => {
      return ctx.db.query.orders.findMany({
        with: {
          customer: true,
          items: {
            with: { dish: true }
          }
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)]
      });
    }),
    updateOrderStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "confirmed", "delivered", "cancelled"])
        })
      )
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, input.orderId))
          .execute();

        return { success: true };
      })
  })
});

export type AppRouter = typeof appRouter;
