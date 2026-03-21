const { z } = require("zod");

const categoryList = [
  "FAST_FOOD",
  "GROCERY",
  "CLOTHING",
  "RESTAURANT",
  "PHARMACY",
  "ELECTRONICS",
  "HOME_GOODS",
  "ONLINE",
  "OTHER",
];
const categoryEnum = z.enum(categoryList)

const storeSchema = z.object({
    name: z.string().trim().min(1),
    category: categoryEnum,
    logoUrl: z.string().optional()

})

// get api validation, both values are optional
export const getStores = (name: string | null, category: string | null) => {

    return storeSchema.safeParse({
    name: name ?? undefined,
    category: category ?? undefined,
  });

}

// post api validation
export const postStore = (name: string, category: string, logoUrl: string | null) => {
    
    // if logoUrl passed
    const result = storeSchema.safeParse({
        name,
        category,
        ...(logoUrl ? { logoUrl } : {}),
    });


    // if schema good
    if(!result.success){
        console.log(result);
        return false;
    }

    return true;
}