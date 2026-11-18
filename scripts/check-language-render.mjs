// Render the actual pages through Vite's module loader. No browser or external requests are needed.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key,value) => store.set(key,String(value)), removeItem: key => store.delete(key) };
const server = await createServer({ server: { middlewareMode: true, open: false, hmr: false }, appType: 'custom',optimizeDeps:{noDiscovery:true,include:[]}, logLevel: 'error' });
const originalError = console.error;
console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) originalError(...args); };
try {
  const { ThemeProvider } = await server.ssrLoadModule('/src/context/ThemeContext.jsx');
  const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
  const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx');
  const { ShopProvider } = await server.ssrLoadModule('/src/context/ShopContext.jsx');
  const {WorkforceProvider}=await server.ssrLoadModule('/src/context/WorkforceContext.jsx');
  const { SupportProvider } = await server.ssrLoadModule('/src/context/SupportContext.jsx');
  const {SellerNavigationProvider}=await server.ssrLoadModule('/src/components/seller/SellerWorkspaceShell.jsx');
  const cases = [
    ['pages/Home.jsx', 'Find repair services', "रिपेयर सर्विस खोजें"],
    ['pages/About.jsx', 'and service records', "और सर्विस रिकॉर्ड"],
    ['pages/Contact.jsx', 'Prepare message', 'मैसेज तैयार करें'],
    ['pages/Login.jsx', 'Email or phone number', 'ईमेल या फ़ोन नंबर'],
    ['pages/Register.jsx', 'Create Your ServiceHub Account', 'अपना ServiceHub अकाउंट बनाएँ'],
    ['pages/Profile.jsx', 'Your Profile', 'आपकी प्रोफाइल'],
    ['pages/customer/FindShop.jsx', 'About Shop &amp; Services', 'दुकान की जानकारी और सर्विस'],
    ['pages/customer/BookRepairModal.jsx', 'Book Repair', 'रिपेयर बुक करें','customer',{shop:{id:'render-booking-shop',shopName:'Booking test shop',shopTypes:['mobile'],services:[{id:'render-saved-service',name:'Saved repair service',labourCharge:250,time:'1 hour',requiresParts:false}]}}],
    ['pages/customer/CustomerDashboard.jsx', 'Welcome back,', 'वापस स्वागत है,'],
    ['pages/shop/ShopDashboard.jsx', 'Repair workload', 'रिपेयर के काम की स्थिति', 'shop_owner'],
    ['pages/shop/ShopRegister.jsx', 'Seller verification', 'दुकानदार की जाँच'],
    ['pages/admin/AdminLogin.jsx', 'Super Admin Portal', 'सुपर एडमिन पैनल', 'admin'],
    ['pages/admin/AdminDashboard.jsx', 'Total Registered Shops', 'कुल रजिस्टर हुई दुकानें', 'admin'],
    ['components/common/Navbar.jsx', 'Logout', null],
    ['components/common/Footer.jsx', 'Privacy Policy', null],
    ['components/common/SupportInbox.jsx', 'My Queries &amp; Live Chats', 'मेरे सवाल और लाइव चैट'],
  ];
  cases.push(['pages/LegalPage.jsx', 'Privacy Policy', '\u092a\u094d\u0930\u093e\u0907\u0935\u0947\u0938\u0940 \u092a\u0949\u0932\u093f\u0938\u0940']);
  cases.push(['pages/LegalPage.jsx', 'Terms &amp; Conditions', '\u0928\u093f\u092f\u092e \u0914\u0930 \u0936\u0930\u094d\u0924\u0947\u0902', 'customer', { type: 'terms' }]);
  cases.push(['components/common/DocumentProof.jsx', 'Review pending', null]);
  cases.push(['components/common/DocumentProof.jsx', 'License verified', null, 'customer', {shop: {id:'proof-test',shopName:'Local shop',verificationStatus:'approved',businessProofType:'Shop & Establishment Act License',businessProofNumber:'TEST-123',businessProofAuthority:'Test authority',businessProofState:'Uttar Pradesh'}}]);
  cases.push(['components/common/LocationSearch.jsx', 'Use my location', null, 'customer', {shops:[], origin:null, onChange() {}}]);
  cases.push(['pages/customer/FindShop.jsx', 'Directions', null, 'customer', {}, '/find-shop?locality=Indirapuram']);
  cases.push(['components/common/SupportInbox.jsx', 'Write your message...', null, 'customer', {selectedId:'inbox-open'}]);
  cases.push(['components/common/SupportInbox.jsx', 'This conversation is resolved', null, 'customer', {selectedId:'inbox-resolved'}]);
  cases.push(['components/common/Navbar.jsx', 'Home', null, 'guest']);
  cases.push(['components/common/Footer.jsx', 'Create an account', null, 'guest']);
  cases.push(['components/common/Navbar.jsx', 'Logout', null, 'shop_owner']);
  cases.push(['components/common/Footer.jsx', 'Privacy Policy', null, 'shop_owner']);
  cases.push(['components/common/Navbar.jsx', 'Dashboard', null, 'admin']);
  cases.push(['pages/customer/CustomerDashboard.jsx', 'My Repairs &amp; Records', null, 'customer', {view:'repairs'}]);
  cases.push(['pages/SupportPage.jsx', 'Help with your repair', null, 'customer', {}, '/support']);
  cases.push(['pages/SupportPage.jsx','Customer support',null,'shop_owner',{},'/support']);
  cases.push(['pages/SupportPage.jsx', 'Shop support inbox', null, 'admin', {}, '/support']);
  cases.push(['pages/shop/BillPage.jsx','Create Bill','बिल बनाएँ','shop_owner',{},'/shop/billing/new']);
  cases.push(['components/seller/BillComposer.jsx','Services / Work Done','सर्विस / किया गया काम','shop_owner',{job:{id:'BK-RENDER',customerName:'Test Customer',customerPhone:'9876543210',deviceBrand:'Test Device'},inventory:[],onSave(){},onCancel(){}}]);
  cases.push(['pages/Settings.jsx', 'Settings', null]);
  cases.push(['pages/MyShop.jsx', 'Public shop profile', null, 'shop_owner']);
  cases.push(['pages/shop/ShopDashboard.jsx', 'Active Job Cards &amp; Repair Orders', null, 'shop_owner', {view:'orders'}]);
  cases.push(['pages/shop/ShopDashboard.jsx', 'Inventory &amp; Spare Parts Stock', null, 'shop_owner', {view:'inventory'}]);
  cases.push(['pages/shop/ShopDashboard.jsx', 'Billing', null, 'shop_owner', {view:'billing'}]);
  cases.push(['pages/shop/ShopDashboard.jsx', 'Services &amp; Pricing', null, 'shop_owner', {view:'services'}]);
  cases.push(['pages/Register.jsx', 'Customer Information', null, 'guest', {customerPage:true}, '/register/customer']);
  cases.push(['pages/Login.jsx', 'Customer sign in', null, 'guest', {accountRole:'customer'}, '/login/customer']);
  cases.push(['pages/Login.jsx', 'Registered Shop Email', null, 'guest', {accountRole:'shop_owner'}, '/login/shop']);
  cases.push(['components/common/CameraCapture.jsx', 'Start camera', null]);
  cases.push(['components/common/CameraCapture.jsx', 'Retake Photo', null, 'customer', {initialImage:'data:image/jpeg;base64,dGVzdA=='}]);
  for(const [step,expected] of [[2,'Business documents'],[3,'Checking registry preview...'],[4,'Preview face-match responses'],[5,'Account Holder Name'],[6,'Verifying your device...'],[7,'Under Review']])cases.push(['pages/seller/SellerVerificationWizard.jsx',expected,null,'guest',{initialStep:step}]);
  cases.push(['pages/seller/SellerVerificationWizard.jsx',"You&#x27;re Verified!",null,'guest',{initialStep:7,initialScenario:'verified'}]);
  cases.push(['pages/seller/SellerVerificationWizard.jsx','Application Rejected',null,'guest',{initialStep:7,initialScenario:'rejected'}]);
  cases.push(['pages/seller/SellerAccountPages.jsx#SellerProfile','Shop profile','दुकान की प्रोफाइल','shop_owner']);
  cases.push(['pages/seller/SellerAccountPages.jsx#PayoutAccount','Payout Account','पैसे पाने वाला अकाउंट','shop_owner']);
  cases.push(['pages/seller/SellerAccountPages.jsx#VerificationHistory','Verification History','जाँच की हिस्ट्री','shop_owner']);
  cases.push(['pages/Settings.jsx','Settings',null,'shop_owner']);
  for(const status of ['VERIFIED','PENDING_REVIEW','REJECTED','EXPIRED'])cases.push(['components/seller/VerificationUI.jsx#VerificationBadge',null,null,'shop_owner',{status}]);
  cases.push(['components/seller/SellerOverview.jsx',null,null,'shop_owner',{loading:true}]);
  cases.push(['components/seller/SellerWorkspaceShell.jsx','Customer workspace',null,'customer',{},'/customer-dashboard']);
  cases.push(['components/seller/SellerWorkspaceShell.jsx','Inventory',null,'shop_owner',{},'/shop/dashboard']);
  cases.push(['components/seller/SellerWorkspaceShell.jsx','Verification History',null,'shop_owner',{},'/settings']);
  cases.push(['components/seller/SellerOverview.jsx','Outstanding payments','बाकी पेमेंट','shop_owner']);
  let count = 0;
  for (const [file, english, hindi, role = 'customer', extraProps = {}, initialPath = '/'] of cases) {
    const loaded = await server.ssrLoadModule('/src/' + file.split('#')[0]);
    const Page=loaded[file.split('#')[1]||'default'];
    for (const language of ['en', 'hi']) {
    for (const theme of ['light', 'dark']) {
      store.set('servicehub_theme', theme);
      store.set('servicehub_language', language);
      const user = { id: role === 'customer' ? 'cust_1' : role === 'shop_owner' ? 'shop_1' : 'admin_1', shopId: 'shop_1', name: 'Sourabh Singh', email: 'actual@personal.in', phone: '9891234567', role };
      if (role === 'guest') store.delete('servicehub_user');
      else store.set('servicehub_user', JSON.stringify(user));
      store.set('servicehub_support', JSON.stringify(['Open','Resolved'].map((status,i)=>({id:i?'inbox-resolved':'inbox-open',kind:i?'ticket':'chat',customerId:'cust_1',customerName:'Sourabh Singh',shopId:'shop_1',shopName:'Local repair workshop',bookingId:'BK-TEST',subject:'Test repair conversation',status,createdAt:'2026-11-07T09:00:00Z',messages:[{id:'message-one',senderId:'cust_1',role:'customer',name:'Sourabh Singh',text:'Customer question',at:'2026-11-07T09:00:00Z'},{id:'message-two',senderId:'shop_1',role:'shop_owner',name:'Workshop owner',text:'Workshop reply',at:'2026-11-07T09:10:00Z'}]}))));
      const page = React.createElement(Page, { shop: { id: 'shop_1', shopName: 'Local shop', locality: 'Ghaziabad' }, onClose() {}, onSelect() {}, ...extraProps });
      const tree = React.createElement(LanguageProvider, null, React.createElement(AuthProvider, null, React.createElement(ShopProvider, null, React.createElement(WorkforceProvider, null, React.createElement(SupportProvider, null, React.createElement(MemoryRouter, {initialEntries:[initialPath]}, React.createElement(SellerNavigationProvider,null,page)))))));
      const html = renderToStaticMarkup(React.createElement(ThemeProvider, null, tree));
      const expected = language === 'hi' ? hindi : english;
      if (expected) assert.ok(html.includes(expected), `${file} missing ${language}: ${expected}`);
      if (file.includes('Navbar')) {
        assert.ok(html.includes('value="hi"'), 'Hindi choice missing');
        assert.ok(html.includes('value="en"'), 'English choice missing');
        assert.ok(new RegExp(`<option[^>]*value="${language}"[^>]*selected=""`).test(html), 'Stored language not selected');
        if (role !== 'guest' && role !== 'admin') assert.ok(html.includes('Sourabh Singh'), 'Personal name changed');
        if (role !== 'guest') {
          assert.ok(!html.includes('>Home</a>') && !html.includes('>About</a>') && !html.includes('>Contact</a>'), 'Public menu in logged-in navbar');
        }
        assert.ok(html.includes('class="theme-switch"'), 'Theme switch missing');
        assert.ok(html.includes(`aria-pressed="${theme === 'dark'}"`), 'Saved theme not reflected in switch');
      }
      if (file.includes('BookRepairModal')) {
        assert.ok(html.includes('value="Smartphone"'), 'Booking device value changed');
        assert.ok(html.includes('value="render-saved-service"'), 'Saved shop services are missing');
      }
      if (initialPath.includes('locality=Indirapuram')) {
        assert.ok(html.indexOf('TechFix Electronics') < html.indexOf('Rajan Mobile'), 'Nearest workshop should appear first');
        assert.ok(html.includes('https://www.google.com/maps/dir/'), 'Google Maps directions missing');
        assert.ok(!html.includes('nearby-summary'), 'Removed location summary remains');
      }
      if (extraProps.selectedId?.startsWith('inbox-')) {
        assert.ok(html.includes('Customer question') && html.includes('Workshop reply'), 'Messages missing');
        assert.ok(html.includes('message-row mine') && html.includes('message-row theirs'), 'Sender alignment missing');
        assert.ok(!html.includes('\uFFFD'), 'Broken text encoding in inbox');
      }
      if (file.includes('Footer') && role !== 'guest') assert.ok(!html.includes('href="/login"') && !html.includes('href="/register"'), 'Auth links still shown after login');
      if (file === 'pages/customer/CustomerDashboard.jsx') {
        assert.equal(html.includes('class="rw-card"'), extraProps.view === 'repairs', 'Orders should only appear on the repairs page');
        assert.ok(!html.includes('support-workspace'), 'Support should have its own page');
      }
      if (file.includes('Navbar') && role !== 'guest' && !['shop_owner','customer'].includes(role)) {
        assert.ok(html.includes('href=\"/settings\"'), 'Settings page missing from navigation');
        assert.ok(!html.includes('#repair-orders') && !html.includes('#support-inbox'), 'Navigation still points to stacked sections');
      }
      if (file === 'pages/Profile.jsx') {
        assert.ok(!/<(input|textarea|select|form|button)\b/.test(html), 'Profile must be read-only');
        assert.ok(html.includes('href=\"/settings\"'), 'Profile should link to Settings');
      }
      if (file === 'pages/Settings.jsx') {
        assert.ok(!html.includes('type=\"password\"'), 'Password change must not be offered');
        assert.ok(html.includes('notification-options'), 'Notification preferences missing');
        if(role==='customer')assert.ok(html.includes('saved-item-list'),'Customer addresses missing');
        assert.equal((html.match(/<form\b/g)||[]).length,1,'Settings should have one combined form');
        assert.ok(html.includes('<fieldset disabled=""'),'Settings must start locked');
        assert.ok(html.includes('settings-edit'),'Global edit action missing');
        assert.ok(!html.includes('account-logout')&&!html.includes('Payment type')&&!html.includes('Account access'),'Removed settings features remain');
      }
      if(file==='pages/Register.jsx') {
        assert.equal(html.includes('<form'),Boolean(extraProps.customerPage),'Customer form must have its own page');
        assert.equal(html.includes('register-role-grid'),!extraProps.customerPage,'Role chooser should not appear on customer form');
        if(extraProps.customerPage){
          assert.ok(!html.includes('<select'),'Customer address should allow free text');
          assert.equal((html.match(/type="password"/g)||[]).length,2,'Create and confirm password fields missing');
          assert.equal((html.match(/class="registration-eye"/g)||[]).length,2,'Both passwords need visibility controls');
          assert.ok(html.includes('registration-submit'),'Compact signup action missing');
          assert.equal((html.match(/minLength="8"/g)||[]).length,2,'Both passwords must require 8 characters');
          assert.ok(html.includes('password-rules'),'Password requirements missing');
          assert.equal((html.match(/class="rule-pending"/g)||[]).length,5,'Password hints should be neutral before signup');
          assert.ok(!html.includes('aria-invalid="true"')&&!html.includes('registration-field-error'),'Field errors must remain hidden before signup');
        }
      }
      if(file==='pages/Login.jsx'&&extraProps.accountRole) assert.ok(html.includes(extraProps.accountRole==='customer'?'href="/register/customer"':'href="/register-shop"'),'Signup must preserve account type');
      if(file==='pages/shop/ShopRegister.jsx') {
        assert.ok(!html.includes('Zero-Fraud')&&!html.includes('जीरो-फ्रॉड'),'Removed zero-fraud badge remains');
        assert.ok(html.includes('sv-step-card')&&html.includes('sv-form-grid'),'Shop layout missing');
        assert.equal((html.match(/type="password"/g)||[]).length,2,'Shop must have create and confirm password fields');
        assert.ok(!html.includes('aria-invalid="true"')&&!html.includes('class="shop-field-error"'),'Shop errors should be hidden before submit');
        assert.ok(html.includes('seller-password'),'Shop password hints missing');
      }
      if(file==='components/common/CameraCapture.jsx'){
        assert.ok(!html.includes('Simulate')&&!html.includes('hardware capture'),'Simulator or false verification text remains');
        assert.equal(html.includes('<video'),!extraProps.initialImage,'Live video and captured preview states should be separate');
        assert.ok(html.includes('camera-capture-footer'),'Camera actions missing');
      }
      if(file.includes('Navbar')&&['shop_owner','customer'].includes(role)){assert.ok(!html.includes('desktop-main-nav')&&!html.includes('public-mobile-nav'),'Seller menu must only be in sidebar');assert.ok(!html.includes('href="/settings"'),'Duplicate seller Settings link in navbar');}
      if(file==='components/seller/SellerOverview.jsx'){assert.ok(!html.includes('sv-seller-cards')&&!html.includes('<a '),'Overview must not repeat sidebar navigation');}
      if(file.includes('SellerWorkspaceShell')){assert.equal((html.match(new RegExp('id="'+(role==='customer'?'customer':'seller')+'-workspace-navigation"','g'))||[]).length,1,'Exactly one seller sidebar');assert.equal((html.match(/href="\/settings"/g)||[]).length,1,'Settings must appear once');assert.ok(html.includes('aria-current="page"'),'Active sidebar route missing');}
      count++;
    }
    }
  }
  console.log(`Passed ${count} real page renders across English/Hindi and light/dark modes.`);
} finally {
  console.error = originalError;
  await server.close();
  delete globalThis.localStorage;
}
