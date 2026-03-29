import { describe, it, expect } from 'vitest'
import {getStores, postStore, getStoreSchema, postStoreSchema} from './zodValidation';

describe('GET Validation', () => {
    it('should pass with valid data', () => {
        const result = getStores('Loblows', 'GROCERY');

        expect(result.success).toBe(true);
    });

    it('should pass with empty name', () => {
        const result = getStores(null, 'GROCERY');

        expect(result.success).toBe(true);
    });
    
    it('should pass with empty category', () => {
        const result = getStores('Loblows', null);

        expect(result.success).toBe(true);
    });

    it('should pass with empty name and category', () => {
        const result = getStores(null, null);

        expect(result.success).toBe(true);
    });

    it('should pass when name has additional whitespace', () => {
        const result = getStores(' nike ', null);

        expect(result.success).toBe(true);
    });

    it('should fail with empty name', () => {
        const result = getStores("", null);

        expect(result.success).toBe(false);
    });

    it('should fail when name is only whitespace', () => {
        const result = getStores(" ", null);

        expect(result.success).toBe(false);
    });

    it('should fail with invalid category', () => {
        const result = getStores("Loblows", "NOT_A_CATEGORY");

        expect(result.success).toBe(false);
    });

    it('should fail with empty name and invalid cateogory', () => {
        const result = getStores("", "NOT_A_CATEGORY");

        expect(result.success).toBe(false);
    });

})

describe('POST Validation', () => {
    it('should pass with valid parameters', () => {
        const result = postStore("Loblows", "GROCERY", "https://google.com");

        expect(result.success).toBe(true);
    });

    it('should pass with null URL', () => {
        const result = postStore("Loblows", "GROCERY", null);

        expect(result.success).toBe(true);
    });

    it('should pass when name has extra white space', () => {
        const result = postStore(" Loblows ", "GROCERY", "https://google.com");

        expect(result.success).toBe(true);
    });

    it('should fail with empty URL', () => {
        const result = postStore("Loblows", "GROCERY", "");

        expect(result.success).toBe(false);
    });

    it('should fail with invalid URL', () => {
        const result = postStore("Loblows", "GROCERY", "123");

        expect(result.success).toBe(false);
    });

    it('should fail when name is only whitespace', () => {
        const result = postStore(" ", "GROCERY", "https://google.com");

        expect(result.success).toBe(false);
    });

    it('should fail with empty name', () => {
        const result = postStore("", "GROCERY", "https://google.com");

        expect(result.success).toBe(false);
    });

    it('should fail with invalid category', () => {
        const result = postStore("Loblows", "GROCERY_CATEGORY", "https://google.com");

        expect(result.success).toBe(false);
    });
})