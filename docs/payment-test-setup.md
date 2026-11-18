# ServiceHub Razorpay test integration

This integration accepts **test keys only**. No real payment activation has been performed.

## Start locally

Requires Node 24+ (uses Node's built-in SQLite). No extra server packages are required.

1. Copy `.env.example` to `.env` in the project root.
2. In your Razorpay dashboard's **Test mode**, generate API credentials. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`. Do not put secrets in chat, frontend code, or `VITE_*` variables.
3. Set `PAYMENT_SHOP_ID` to the owner's actual shop id (the default local shop is `shop_1`). One backend instance currently serves one configured shop and one Razorpay merchant account.
4. Run `npm run payments:server` in one terminal, and `npm run dev` in another. Open `http://localhost:3000`.
5. Ensure test payments are captured automatically in Razorpay's capture settings. Merely **authorized** payments are not treated as completed.

Without keys, the backend can generate and store guest links for UI preview, but checkout stays disabled. No fake success is offered to customers. Automated gateway tests inject a fake Razorpay API in process; the running application does not use this mock.

## Owner, customer and technician flow

1. Complete repair work so the booking reaches **Payment Due**.
2. Owner opens the booking's **Online payment** section, confirms the final amount, then clicks **Create payment link / QR**. Creating a link requires the backend's authenticated payment desk session; browser role/localStorage alone cannot authorize a server payment.
3. On localhost, the local test desk connects only from the same local machine. When exposed publicly, set a strong `PAYMENT_OPERATOR_PASSWORD`, then enter it in the owner form. Never share this password with customers or technicians.
4. The amount is locked server-side for that booking. Share/copy the URL or show its QR. The QR opens the booking's payment page, not a generic shop UPI address.
5. Guest opens `/pay/<random-token>`. No ServiceHub registration is needed. Only booking reference, service, merchant and amount are exposed; customer address/contact details are omitted. Treat this URL as private.
6. Customer clicks **Pay securely with Razorpay**. Server creates/reuses a Razorpay order for the saved INR amount. Checkout signature is verified server-side and the payment is fetched from Razorpay; amount, currency, order and **captured** state must match.
7. Guest page polls status. Owner/counter/technician/customer views poll the backend and update the matching local booking to paid/completed. Technician can then confirm final completion. If the customer closes the page, webhooks still settle the server ledger.
8. Existing registered customers see **Pay securely** on My Repairs once the owner publishes the link. Same-browser existing workspace state is synchronized across tabs. A link can be opened from another device once deployed publicly.

Manual cash/external-UPI receipt recording remains available **before** an online link is created. After creating a link, manual settlement is blocked to prevent collecting the same charge twice. Link cancellation, refunds, partial payments, changed-price links and chargebacks need a separate reconciliation flow and are not implemented here.

## Public customer links and webhooks

`localhost` is only reachable on this computer. For a customer's phone or a Razorpay webhook:

- Serve the frontend and `/api/payments/*` backend under one public HTTPS origin.
- Set `PUBLIC_APP_URL=https://your-test-host.example` and a strong operator password before starting the backend. Local password-free desk login is disabled for public origins.
- Reverse proxy `/api/payments/*` to the payment API; keep `.data/`, `.env`, database files and server source private. Vite dev proxy is for local testing only.
- Create a test webhook in Razorpay for `payment.captured`, pointing to `https://your-test-host.example/api/payments/webhook`.
- Configure a unique webhook signing secret in `RAZORPAY_WEBHOOK_SECRET`. The backend verifies the raw body HMAC, then fetches the payment from Razorpay. Duplicate deliveries are idempotent.
- Restart the backend when `.env` changes.

## What is persisted and what is still local

`.data/payments.sqlite` stores immutable booking amounts, random guest capabilities, gateway order/payment references, payment status and audit history. Keep this file backed up and private.

The rest of the pre-existing application still uses browser localStorage for accounts, members and booking records. This change **does not migrate the whole app's authentication or booking database**. It adds a real server payment ledger and verifies gateway receipts. Full multi-device owner/customer/technician workspaces require migrating those existing records and auth to a shared backend. This is a test integration, not production readiness for a multi-merchant marketplace.

For real payments, also plan full authenticated shop/user roles, merchant onboarding/settlement, account tenancy, refunds, tax/receipt requirements and reconciliation before removing test-only restrictions.

## Verification

Run `npm run test:payments` and `npm run build`. Tests cover unauthorized creation, operator shop scoping, tampered amounts/signatures/orders, authorization vs capture, successful verified settlement, duplicate callbacks/webhooks, expiry, persistent database recovery and client status mapping.

Primary references: [Razorpay web checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [webhook signature verification](https://razorpay.com/docs/webhooks/validate-test/).

## Repair charges and automatic links

During Repairing, the assigned technician can record catalogue services and request inventory parts with quantity and variant. Service labour prices are recorded with the work; parts use the selling price saved when the owner approves and issues them. Pending parts block final charge publication.

The total includes recorded services, approved parts and, for home service, the existing distance ? shop rate calculation. This is geographic straight-line distance, not a road-routing estimate. Missing required coordinates stop automatic link creation. Once a link is published, a charge snapshot keeps payment and the later invoice aligned even if catalogue prices change.

While an owner workspace is open, Ready / Payment Due jobs with complete charges get a payment link automatically. The localhost test payment desk can connect automatically; public deployments require an already authenticated payment desk session or manual password entry. Failure leaves the existing Create payment link / QR button available. This is browser-driven automation; it does not run when all owner workspaces are closed.

Verified captured payments are synchronized by the existing payment polling/webhook flow. After payment, Generate Bill preloads the same services, approved parts and home charge. Issued parts are credited against billing stock allocations so they are not deducted twice. Legacy manual-payment jobs without recorded work retain their existing billing flow.

Technician Add Part now issues stock immediately during Repairing without owner approval. The job stores quantity, selling price, batch allocations and technician/time as an Issued record. These records feed the payment total and invoice stock credits, avoiding a second deduction. Older Pending requests retain their existing review flow.

## Cash alongside a payment link

Cash collection remains available with a published link. The authenticated payment desk settles the server ledger as cash, records the collector and disables subsequent checkout. The assigned technician can collect for shop and home jobs. If a Razorpay order has already been opened, cash settlement is blocked until the online attempt is reconciled; an already opened provider checkout cannot safely be revoked by merely hiding the ServiceHub link. Customer-facing receipt text distinguishes shop-recorded cash from Razorpay verification.
