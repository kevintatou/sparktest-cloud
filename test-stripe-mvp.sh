#!/usr/bin/env bash
# Simple test script to verify the Stripe Checkout MVP implementation

echo "🧪 Testing Stripe Checkout MVP Implementation"
echo "============================================"

# Test 1: Check if backend compiles
echo "1. Testing backend compilation..."
if cargo check --all > /dev/null 2>&1; then
    echo "✅ Backend compiles successfully"
else
    echo "❌ Backend compilation failed"
    exit 1
fi

# Test 2: Check if frontend builds
echo "2. Testing frontend build..."
if pnpm build:saas-frontend > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Test 3: Check if required files exist
echo "3. Testing required files..."
files=(
    "apps/saas/backend/core/src/lib.rs"
    "apps/saas/backend/api/src/lib.rs"
    "apps/saas/frontend/src/lib/api.ts"
    "apps/saas/frontend/src/hooks/use-billing.ts"
    "apps/saas/frontend/src/components/dashboard/billing-section.tsx"
    ".env.example"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Test 4: Check if Plan model is properly defined
echo "4. Testing Plan model..."
if grep -q "pub struct Plan" apps/saas/backend/core/src/lib.rs; then
    echo "✅ Plan model defined in backend"
else
    echo "❌ Plan model missing in backend"
    exit 1
fi

# Test 5: Check if billing endpoints are defined
echo "5. Testing billing endpoints..."
if grep -q "/api/billing/plans" apps/saas/backend/api/src/lib.rs && grep -q "/api/billing/checkout" apps/saas/backend/api/src/lib.rs; then
    echo "✅ Billing endpoints defined"
else
    echo "❌ Billing endpoints missing"
    exit 1
fi

# Test 6: Check if Stripe dependencies are added
echo "6. Testing Stripe dependencies..."
if grep -q "stripe.*async-stripe" apps/saas/backend/api/Cargo.toml; then
    echo "✅ Stripe dependency added"
else
    echo "❌ Stripe dependency missing"
    exit 1
fi

# Test 7: Check if frontend API service exists
echo "7. Testing frontend API service..."
if grep -q "createCheckoutSession" apps/saas/frontend/src/lib/api.ts; then
    echo "✅ API service with checkout function exists"
else
    echo "❌ API service missing checkout function"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Stripe Checkout MVP implementation is ready."
echo ""
echo "📋 Next steps for production:"
echo "1. Set up actual Stripe account and get real API keys"
echo "2. Create Stripe products and price IDs"
echo "3. Update .env with real Stripe configuration"
echo "4. Test with real Stripe Checkout"
echo "5. Add webhook handling for subscription events"
echo "6. Add proper error handling and logging"