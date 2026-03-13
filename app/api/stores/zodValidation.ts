const { z } = require("zod");

const categoryList = ["FAST_FOOD", "GROCERY", "CLOTHING", "RESTAURANT"];

const categoryEnum = z.enum(categoryList)

const storeSchema = z.object({
    name: z.string(),
    category: categoryEnum,
    logoUrl: z.string().optional()

})

// get api validation, both values are optional
const getStores = (name: string | null, category: string | null) => {

    // validate schema if both filled in
    const resultWithBoth = storeSchema.safeParse({name: name, category: category});
    // validate schema if only name filled in
    const resultWithName = storeSchema.safeParse({name: name, category: categoryList[0]});
    // validate schema if only category filled in
    const resultWithCat = storeSchema.safeParse({name: "", category: category});
    // validate schema if neither filled in
    const resultWithoutBoth = storeSchema.safeParse({name: "", category: categoryList[0]});

    // if any of the above validations passed, true
    if(resultWithBoth.success || resultWithName.success || resultWithCat.success || resultWithoutBoth.success) {
        return true;
    }

    return false;
}

// post api validation
const postStore = (name: string, category: string, logoUrl: string | null) => {
    var result;
    
    // if logoUrl passed
    if(logoUrl){
        result = storeSchema.safeParse({name: name, category: category, logoUrl: logoUrl});
    } else { //if no logoUrl
        result = storeSchema.safeParse({name: name, category: category});

    }
    // if schema good, good :)
    if(!result.success){
        console.log(result);
        return false;
    }

    return true;
}

// expect: true
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
