# ServiceHub - Local Repair Shop Management Platform (Ghaziabad)

**ServiceHub** is an anti-fraud, digital job card and repair management platform built to digitize unorganized local repair shops (smartphones, laptops, home appliances) in Ghaziabad.

It eliminates manual pen-paper and Excel irregularities while preventing fraudulent shop registrations using **WebRTC Live Camera KYC (Selfie with Aadhaar)**, **GPS Geolocation tagging**, and **Super Admin 2FA Verification**.

---

## 🚀 Quick Start (How to Run)

1. Open your terminal inside this directory (`SERVICEHUB`).
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at **`http://localhost:3000`**.

---

## 🛡️ Anti-Fraud & Verification System

| Feature | Implementation | Purpose |
| :--- | :--- | :--- |
| **Live Camera KYC** | `navigator.mediaDevices.getUserMedia` | Gallery file upload is disabled. Shop owner must take a live selfie holding their physical Aadhaar card facing the camera. |
| **GPS Geolocation** | `navigator.geolocation.getCurrentPosition` | Tags exact latitude & longitude coordinates to verify shop presence in Ghaziabad. |
| **Govt Business Proof** | Udyam MSME / Trade License / GSTIN | Ensures only legally registered businesses are listed. |
| **AI Trust Score** | Automated Verification Algorithm | Calculates confidence score ($80\%+$ threshold for auto-approval recommendation). |
| **Super Admin 2FA** | OTP Authenticated Session | Master review panel to inspect live photos and approve/reject before shops go public. |

---

## 👥 Multi-Role User Journeys

### 1. Customer
* Search verified repair shops by locality in Ghaziabad (RDC, Indirapuram, Vaishali, Kavi Nagar).
* Fill interactive repair booking form with device symptoms and preferred delivery mode.
* Track repair progress through a live 6-stage milestone tracker.
* Access past service history and digital invoices for warranty claims.

### 2. Shop Owner
* Anti-fraud onboarding with live camera selfie holding Aadhaar, GPS coordinates, and MSME/Trade license.
* Access Shop Dashboard with real-time job cards.
* Update repair status (*Diagnosing, Waiting for Parts, Repaired, Ready for Pickup*) and set billing amount.

### 3. Super Admin
* 2-Factor Authentication (OTP) login.
* Shop KYC Audit Queue: Inspect live camera snapshots, open GPS coordinates on Google Maps, and verify Govt documents.
* One-click **"Approve & Activate Shop"** or **"Reject with Reason"**.

---

## 📂 Project Structure

```text
SERVICEHUB/
├── legacy-vanilla/        # Archived original HTML/CSS files for safe reference
├── public/                # Static public assets
├── src/
│   ├── components/
│   │   └── common/        # Navbar, Footer, CameraCapture, LocationPicker
│   ├── context/
│   │   ├── AuthContext.jsx # 2FA Authentication & Role State
│   │   └── ShopContext.jsx # Central Store for Shops, Bookings & KYC
│   ├── pages/
│   │   ├── Home.jsx       # Landing Page & Anti-Fraud Architecture
│   │   ├── Login.jsx      # Multi-role Login with 1-Click Evaluation presets
│   │   ├── customer/      # FindShop & CustomerDashboard
│   │   ├── shop/          # ShopRegister & ShopDashboard
│   │   └── admin/         # AdminLogin (2FA) & AdminDashboard
│   ├── App.jsx            # Routing
│   ├── main.jsx           # Vite React Root
│   └── index.css          # Tailwind Directives & Custom Scrollbar
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🔮 Next Semester Backend & Cloud Roadmap
* **Database:** PostgreSQL / Supabase for structured tickets & billing; Redis for OTP & caching.
* **Storage:** AWS S3 or Cloudinary free tier for KYC documents & repair images.
* **AI Engine:** Python OpenCV / Face-API for biometric liveness match & document OCR.


## Seller verification frontend

`/register-shop` is a seven-step wizard. Preview scenarios are available in the wizard sidebar.

- OTP: `123456` (shown in the demo; no SMS/email is sent).
- Micro-deposit: `0.37` (no bank transfer occurs; one retry is allowed).
- Face movement runs locally with MediaPipe; face-match responses have separate labelled demo controls.
- A failed face response three times opens selfie + 10-second video selection for manual-review preview.
- `/shop/profile`, `/shop/payout-account`, and `/shop/verification-history` are protected seller account pages.
- Phone/email changes remain pending actual backend verification. Payout changes require the demo face → OTP → micro-deposit sequence.
- Passing the preview never grants actual shop approval; shop records remain pending and public listing uses the recorded admin approval.
- Files and face captures stay in page memory. Payout persistence uses only holder/bank/IFSC/last four digits, not full account numbers. PAN and registry references in history metadata are masked. Passwords are not persisted.
- Registration files and bank-entry drafts are not restored after reloading the page.
- GSTIN accepts the 15-character identifier (formatted for display); PAN uses the standard letter/digit pattern. Udyam supports the official `UDYAM-XX-00-0000000` number and the requested 13-character demo reference. None of these format checks query government records.

Connect trusted backend/provider adapters before using OTP, registry, face-match, payout, rejection cooldown or device results as authorization decisions. The browser preview is not a production verification system.

Checks: `node scripts/seller-verification.test.mjs`, `node scripts/seller-interactions.test.mjs`, `node scripts/check-language-render.mjs`, `npm run build`.
