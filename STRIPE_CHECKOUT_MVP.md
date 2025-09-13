# Stripe Checkout MVP Implementation

This implementation adds Stripe Checkout functionality to the SparkTest SaaS platform with two subscription plans: Free and Pro.

## Features Implemented

### Backend (Rust + Axum)
- ✅ **Plans Table**: New `Plan` model with `id`, `slug`, `price_cents`, `features json`, and `stripe_price_id`
- ✅ **API Endpoints**:
  - `GET /api/billing/plans` - List available plans
  - `POST /api/billing/checkout` - Create Stripe checkout session
- ✅ **Default Plans**:
  - **Free Plan**: $0/month, 5 tests, 100 runs/month, community support
  - **Pro Plan**: $29/month, unlimited tests/runs, priority support, advanced analytics
- ✅ **Stripe Integration**: Using `async-stripe` crate for checkout session creation

### Frontend (Next.js + TypeScript)
- ✅ **Billing Section**: Interactive plan cards with features and pricing
- ✅ **Upgrade Flow**: "Upgrade" button launches Stripe Checkout
- ✅ **API Service**: Type-safe API client for billing operations  
- ✅ **Success/Cancel Handling**: Redirects back to dashboard with toast notifications
- ✅ **Responsive Design**: Works on desktop and mobile

## Setup Instructions

### 1. Environment Configuration
Copy `.env.example` to `.env` and update with your Stripe keys:

```bash
cp .env.example .env
```

Update these variables:
```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_PRO_PRICE_ID=price_your_actual_price_id
```

### 2. Stripe Setup
1. Create a [Stripe account](https://stripe.com)
2. Create a product called "SparkTest Pro" 
3. Add a recurring price of $29/month
4. Copy the price ID to `STRIPE_PRO_PRICE_ID` in your `.env`

### 3. Run the Application

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build:packages

# Start backend (in one terminal)
cargo run --bin sparktest-saas-server

# Start frontend (in another terminal) 
pnpm dev:frontend
```

### 4. Test the Implementation

```bash
# Run automated tests
./test-stripe-mvp.sh

# Manual testing:
# 1. Visit http://localhost:3000
# 2. Navigate to "Billing & Plans" 
# 3. Click "Upgrade" on Pro plan
# 4. Complete checkout flow
# 5. Verify redirect back to dashboard
```

## Implementation Details

### Database Schema
The `Plan` model includes:
- `id`: UUID primary key
- `slug`: Human-readable identifier ("free", "pro")  
- `price_cents`: Price in cents (0 for free, 2900 for $29)
- `features`: JSON object with plan features
- `stripe_price_id`: Stripe price ID for subscription creation
- `created_at` / `updated_at`: Timestamps

### API Flow
1. Frontend calls `GET /api/billing/plans` to load available plans
2. User clicks "Upgrade" button
3. Frontend calls `POST /api/billing/checkout` with plan slug
4. Backend creates Stripe checkout session  
5. User redirected to Stripe Checkout
6. After payment, user redirected back to dashboard

### Error Handling
- Invalid plan slugs return 404
- Missing Stripe configuration returns 500
- Frontend shows loading states and error toasts
- Free plan skips Stripe and redirects immediately

## Next Steps

### Production Readiness
- [ ] Add webhook handling for subscription events
- [ ] Implement subscription status tracking
- [ ] Add billing history and invoice management
- [ ] Set up proper error logging and monitoring
- [ ] Add customer portal integration
- [ ] Implement plan change/cancellation flows

### Testing
- [ ] Add unit tests for plan CRUD operations
- [ ] Add integration tests for checkout flow  
- [ ] Add E2E tests with Stripe test mode
- [ ] Add error scenario testing

### Security
- [ ] Validate webhook signatures
- [ ] Add rate limiting to billing endpoints
- [ ] Implement proper authentication/authorization
- [ ] Add audit logging for billing events

## Architecture Notes

This implementation follows the existing patterns in the codebase:
- Backend uses in-memory storage (matches existing test definitions)
- API follows RESTful conventions
- Frontend uses hooks and context patterns
- Error handling uses toast notifications
- Styling follows existing Tailwind + Radix patterns

The implementation is designed to be minimal and focused on the core MVP requirements while being easily extensible for production features.