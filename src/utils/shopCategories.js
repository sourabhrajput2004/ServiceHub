// Stored values stay stable; Hindi labels are presentation only.
export const SHOP_CATEGORY_GROUPS=[
 {id:'mobile',label:'Mobile & Wearables',hi:'मोबाइल और पहनने वाले डिवाइस',items:[
  ['Mobile Phones','मोबाइल / स्मार्टफोन','Mobile Phones'],['Feature Phones','कीपैड फोन','Mobile Phones'],['Tablets','टैबलेट','Mobile Phones'],['iPads','आईपैड','Mobile Phones'],['Smartwatches','स्मार्टवॉच','Mobile Phones'],['Fitness Bands','फिटनेस बैंड','Mobile Phones']
 ]},
 {id:'computers',label:'Laptops, Computers & Accessories',hi:'लैपटॉप, कंप्यूटर और एक्सेसरीज़',items:[
  ['Laptops & Computers','लैपटॉप','Laptops & Computers'],['Desktop Computers','डेस्कटॉप कंप्यूटर','Laptops & Computers'],['MacBooks','मैकबुक','Laptops & Computers'],['Computer Monitors','कंप्यूटर मॉनिटर','Laptops & Computers'],['Printers & Scanners','प्रिंटर और स्कैनर','Laptops & Computers'],['Wi-Fi Routers','वाई-फाई राउटर','Laptops & Computers'],['Gaming Consoles','गेमिंग कंसोल','Laptops & Computers'],['Computer Accessories','कीबोर्ड, माउस और कंप्यूटर एक्सेसरीज़','Laptops & Computers']
 ]},
 {id:'tv',label:'TV, Audio & Electronics',hi:'टीवी, ऑडियो और इलेक्ट्रॉनिक्स',items:[
  ['TV & Audio','टीवी / ऑडियो','TV & Audio'],['LCD TVs','LCD टीवी','TV & Audio'],['LED TVs','LED टीवी','TV & Audio'],['OLED TVs','OLED टीवी','TV & Audio'],['QLED TVs','QLED टीवी','TV & Audio'],['Smart TVs','स्मार्ट / एंड्रॉयड टीवी','TV & Audio'],['Projectors','प्रोजेक्टर','TV & Audio'],['Home Theatres','होम थिएटर','TV & Audio'],['Speakers & Soundbars','स्पीकर और साउंडबार','TV & Audio'],['Amplifiers','एम्प्लीफायर','TV & Audio'],['Headphones & Earphones','हेडफोन और ईयरफोन','TV & Audio'],['Cameras','कैमरे','TV & Audio'],['CCTV & DVR','CCTV कैमरे और DVR','TV & Audio']
 ]},
 {id:'cooling',label:'Cooling & Laundry Appliances',hi:'ठंडक और कपड़े धोने के उपकरण',items:[
  ['Air Conditioners','AC / एयर कंडीशनर','Home Appliances'],['Refrigerators','फ्रिज / रेफ्रिजरेटर','Home Appliances'],['Deep Freezers','डीप फ्रीज़र','Home Appliances'],['Air Coolers','कूलर','Home Appliances'],['Washing Machines','वॉशिंग मशीन','Home Appliances'],['Clothes Dryers','कपड़े सुखाने की मशीन','Home Appliances'],['Dishwashers','डिशवॉशर','Home Appliances']
 ]},
 {id:'kitchen',label:'Kitchen Appliances',hi:'रसोई के उपकरण',items:[
  ['Microwave Ovens','माइक्रोवेव','Home Appliances'],['OTG & Electric Ovens','OTG और इलेक्ट्रिक ओवन','Home Appliances'],['Induction Cooktops','इंडक्शन चूल्हे','Home Appliances'],['Gas Stoves & Hobs','गैस स्टोव / हॉब','Home Appliances'],['Kitchen Chimneys','किचन चिमनी','Home Appliances'],['Mixer Grinders','मिक्सर ग्राइंडर','Home Appliances'],['Juicers & Blenders','जूसर और ब्लेंडर','Home Appliances'],['Food Processors','फूड प्रोसेसर','Home Appliances'],['Water Purifiers','RO / पानी के प्यूरीफायर','Home Appliances'],['Water Dispensers','वॉटर डिस्पेंसर','Home Appliances'],['Electric Kettles','इलेक्ट्रिक केतली','Home Appliances'],['Rice Cookers','राइस कुकर','Home Appliances'],['Toasters & Sandwich Makers','टोस्टर और सैंडविच मेकर','Home Appliances'],['Coffee Makers','कॉफी मेकर','Home Appliances']
 ]},
 {id:'home',label:'Other Home Appliances & Power',hi:'घर के दूसरे उपकरण और पावर',items:[
  ['Home Appliances','दूसरे घरेलू उपकरण','Home Appliances'],['Geysers & Water Heaters','गीज़र / वॉटर हीटर','Home Appliances'],['Room Heaters','रूम हीटर','Home Appliances'],['Fans & Exhaust Fans','पंखे और एग्जॉस्ट फैन','Home Appliances'],['Electric Irons','इलेक्ट्रिक प्रेस','Home Appliances'],['Vacuum Cleaners','वैक्यूम क्लीनर','Home Appliances'],['Air Purifiers','एयर प्यूरीफायर','Home Appliances'],['Inverters & UPS','इन्वर्टर और UPS','Home Appliances'],['Batteries & Stabilizers','बैटरी और स्टेबलाइज़र','Home Appliances'],['Sewing Machines','सिलाई मशीन','Home Appliances']
 ]}
];
export const SHOP_CATEGORIES=SHOP_CATEGORY_GROUPS.flatMap(g=>g.items.map(([value])=>value));
export function validShopCategories(values){return Array.isArray(values)&&values.length>0&&values.length<=SHOP_CATEGORIES.length&&new Set(values).size===values.length&&values.every(v=>SHOP_CATEGORIES.includes(v));}
export function matchesShopCategory(shop,category){
 if(!category||category==='All Devices')return true;
 const values=shop.categories||[];if(values.includes(category))return true;
 return SHOP_CATEGORY_GROUPS.some(g=>g.items.some(([value,,directory])=>directory===category&&values.includes(value)));
}
export function shopCategoryLabel(value,language){const item=SHOP_CATEGORY_GROUPS.flatMap(g=>g.items).find(([id])=>id===value);return language==='hi'&&item?item[1]:value;}
