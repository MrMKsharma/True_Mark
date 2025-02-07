module product_registry::registry {
    use std::string::{Self, String};
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;

    // Errors
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_PRODUCT_EXISTS: u64 = 2;
    const E_PRODUCT_NOT_FOUND: u64 = 3;

    struct Product has store, drop {
        id: String,
        name: String,
        manufacturer: address,
        timestamp: u64,
        is_authentic: bool
    }

    struct ProductRegistry has key {
        products: vector<Product>
    }

    public entry fun init_registry(account: &signer) {
        let registry = ProductRegistry {
            products: vector::empty()
        };
        move_to(account, registry);
    }

    public entry fun register_product(
        account: &signer,
        id: String,
        name: String,
    ) acquires ProductRegistry {
        let account_addr = signer::address_of(account);
        
        // Get registry
        let registry = borrow_global_mut<ProductRegistry>(account_addr);
        
        // Create new product
        let product = Product {
            id,
            name,
            manufacturer: account_addr,
            timestamp: timestamp::now_seconds(),
            is_authentic: true,
        };

        // Add product to registry
        vector::push_back(&mut registry.products, product);
    }

    #[view]
    public fun verify_product(
        registry_addr: address,
        product_id: String
    ): bool acquires ProductRegistry {
        let registry = borrow_global<ProductRegistry>(registry_addr);
        let i = 0;
        let len = vector::length(&registry.products);
        
        while (i < len) {
            let product = vector::borrow(&registry.products, i);
            if (product.id == product_id) {
                return product.is_authentic
            };
            i = i + 1;
        };
        false
    }
}
