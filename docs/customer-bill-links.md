# Customer bill links on WhatsApp

Send on WhatsApp prepares the customer-only PDF, publishes it through the authenticated billing desk, and opens the customer's WhatsApp chat with a greeting, customer name, shop name and a clickable PDF URL. The sender does not download or attach the PDF. The user still presses Send in WhatsApp.

The PDF contains services, spare part names/quantities and the final total. Individual rates and internal cost allocations are omitted. The customer can view the PDF without registering; `?download=1` requests a file download. Browser PDF viewers may also provide their own download button.

Documents are stored in the private SQLite database `.data/payments.sqlite`. Each bill revision has a random 256-bit capability URL, valid for one year. Identical PDF bytes reuse the same link. Treat the URL as private: anyone receiving it can open the bill. There is no invoice-number lookup or public bill listing. Back up the database; deleting it loses shared PDFs.

## Local testing versus customer access

Run the frontend and `npm run payments:server`. Localhost billing desk login works on this computer; public deployments require the configured billing desk password/session. PDF publishing is limited to the configured shop.

For customers on other phones/laptops, deploy the frontend and `/api/payments/*` backend at one public HTTPS origin, configure `PUBLIC_APP_URL`, configure a strong `PAYMENT_OPERATOR_PASSWORD`, and restart the backend. Keep `.env` and `.data` private. The existing Vite proxy supports local testing only. A localhost URL in WhatsApp cannot be opened by a different device.

PDF sharing via a clickable link does not require Meta Cloud API or Twilio. Automatic document delivery directly into WhatsApp is a different integration and is not performed here.

Checks: `node scripts/bill-links.test.mjs`, `node scripts/invoice-sharing.test.mjs`, `npm run build`.

## Temporary PDF-only public test

A signed official Cloudflare cloudflared binary is kept privately under `.data/tools/`. The temporary tunnel forwards only `127.0.0.1:3002`, served by `node server/payments/publicBills.mjs`. That server opens the bill database read-only and only accepts GET/HEAD requests for valid random PDF URLs. It does not expose the frontend, payment APIs, login, filesystem or database download.

The payment/billing API reads the current HTTPS origin from `.data/bill-public-url.txt`, or from `BILL_PUBLIC_URL` when explicitly configured. Existing payment links and localhost operator login are unaffected. WhatsApp bill messages reject localhost/LAN/non-HTTPS addresses and use `?download=1` so the recipient receives a PDF attachment response. Bill links in the UI are blue underlined anchors.

The temporary address only works while the computer, PDF server and cloudflared tunnel remain running. A tunnel restart creates a different address; update `.data/bill-public-url.txt` and share fresh links. This is not permanent hosting. Keep `.data` private.
