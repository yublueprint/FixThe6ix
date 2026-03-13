const { z } = require("zod");

const categoryEnum = z.enum(["FAST_FOOD", "GROCERY", "CLOTHING", "RESTAURANT"])

const storeSchema = z.object({
    name: z.string(),
    category: categoryEnum,
    logoUrl: z.string().optional()

})

const getStores = (name: string | null, category: string | null) => {
    const result = storeSchema.safeParse({name: name, category: category, logoUrl: ""});

    if(name != null && category != null && !result.success){
        console.log(result);
        return false;
    }

    return true;
}

const postStore = (name: string, category: string, logoUrl: string | null) => {
    const result = storeSchema.safeParse({name: name, category: category, logoUrl: ""});

    if(!result.success){
        console.log(result);
        return false;
    }

    return true;
}

// // expect: true
// console.log(getStores("name 1", "FAST_FOOD"));
// // expect: false
// // expect: false
// // expect: false
// // expect: false
// console.log(getStores(null, "FAST_FOOD"));
// // expect: false
// console.log(getStores("name 1", null));
// // expect: false
// console.log(getStores(null, null));

// // expect: true
// console.log(postStore("name 2", "FAST_FOOD", "url 2"));
// // expect: true
// console.log(postStore("name 2", "FAST_FOOD", null));
// // expect: false
