# Technician location workflow

The local app has an explicit Start sharing control. It runs a high-accuracy geolocation watch while the technician is logged into the member workspace and checked in for the current Indian date. Moving between member pages keeps the watch alive. Checkout, logout, a removed/inactive membership, tab closure or Stop sharing clears the watch and removes saved coordinates. A heartbeat and freshness check hide abandoned/stale positions.

Owner technician/member cards open a live map. Customer tracking is limited to the customer's own active assigned home-service job. Completed/cancelled/reassigned jobs cannot expose the previous technician's location. A home-service technician can view the customer's destination, open navigation, and start sharing from the destination dialog. Browser GPS permission remains required.

## Deployment limitation

This location implementation uses browser localStorage and storage events. It supports local testing across tabs of the same browser origin. It does **not** transmit GPS from a technician's phone to an owner's or customer's different device. The existing accounts, attendance and bookings also remain browser-local; the payment API does not authenticate member/customer sessions.

Production device-to-device tracking needs authenticated shared member/customer accounts, server-owned assignment/attendance records, scoped location write/read endpoints, revocation on checkout/logout, and a public HTTPS deployment (polling or WebSocket/SSE). Client-supplied role or member IDs alone must not authorize access to precise location. Do not expose the localStorage preview as a secure tracking API.
