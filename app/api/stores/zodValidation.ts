const { z } = require("zod");

const categoryEnum = z.enum([
  "FAST_FOOD", "GROCERY", "CLOTHING", "RESTAURANT",
  "PHARMACY", "ELECTRONICS", "HOME_GOODS", "ONLINE", "OTHER",
]);

// GET ?name=&category= — both optional; empty query = valid
export const getStoreSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: categoryEnum.optional(),
});

// POST body — full resource
export const postStoreSchema = z.object({
  name: z.string().trim().min(1),
  category: categoryEnum,
  logoUrl: z.string().url().optional(), // or z.string().optional() if URLs aren’t strict yet
});

// get api validation, both values are optional
export const getStores = (name: string | null, category: string | null) => {

    return getStoreSchema.safeParse({
    name: name ?? undefined,
    category: category ?? undefined,
  });

}

// post api validation
export const postStore = (name: string, category: string, logoUrl: string | null) => {
    
    // if logoUrl passed
    return postStoreSchema.safeParse({
        name,
        category,
        logoUrl: logoUrl ?? undefined,
    });

}