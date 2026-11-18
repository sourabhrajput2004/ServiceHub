import CompactOrderCard from '../../components/seller/CompactOrderCard';
import {ORDER_STAGES,orderStageMatches} from '../../utils/orderStages';
import CustomerInvoiceActions from '../../components/seller/CustomerInvoiceActions';
import {workflowStage} from '../../utils/repairWorkflow';
import OwnerJobWorkflow from '../../components/seller/OwnerJobWorkflow';
import {workStatus} from '../../utils/orderFulfilment';
import InventoryWorkspace from '../../components/seller/InventoryWorkspace';
import {WorkUpdates} from '../../components/seller/TechnicianWork';
import JobAssignment,{ServiceDispatchInfo} from '../../components/seller/JobAssignment';
import InvoiceDocument from '../../components/seller/InvoiceDocument';
import {BusinessDialog} from '../../components/seller/ServiceWorkspace';
import {printInvoice} from '../../utils/invoiceDocument';
import OrderRecordActions from '../../components/seller/OrderRecordActions';
import {serviceMode,repairDirections,jobCardStatus} from '../../utils/repairService';
import {invoiceState,cancelledInvoice} from '../../utils/invoiceLifecycle';
import AddRepairButton from '../../components/seller/AddRepairButton';
import ServiceWorkspace from '../../components/seller/ServiceWorkspace';
import BillingWorkspace from '../../components/seller/BillingWorkspace';
import '../../styles/seller-orders.css';
import { repairStage } from '../../utils/workshopOverview';
import SellerOverview from '../../components/seller/SellerOverview';
import { useLanguage } from "../../context/LanguageContext";import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {Store, Wrench, Package, Users, Receipt, MapPin, Search, Plus, CheckCircle2, Clock, AlertTriangle, Phone, DollarSign, Filter, ShieldCheck, Printer, RefreshCw, X, Eye, Navigation, Sparkles, CreditCard, UploadCloud, Image, TrendingUp} from 'lucide-react';

export default function ShopDashboard({ view = 'overview' }) {const { tr, language } = useLanguage();
  const { shops, bookings:allBookings, inventory:allInventory, technicians:allTechnicians, invoices:allInvoices,
    updateBookingStatus, addInventoryItem, updateInventoryStock, restockInventoryItem,
    addTechnician, updateTechnicianLocation, createInvoice, approveOrRecordPayment,
    setTechnicians, invoiceError
  } = useShop();

  const { user } = useAuth();

  const currentShop = shops.find((s) => s.id === (user?.shopId||user?.id));
  const belongs=row=>(row.shopId||'shop_1')===currentShop?.id;
  const bookings=allBookings.filter(b=>belongs(b)&&!b.archivedAt),inventory=allInventory.filter(belongs),technicians=allTechnicians.filter(belongs),invoices=allInvoices.filter(belongs);

  // Navigation tab in shop dashboard
  const navigate = useNavigate();
  const activeTab = view === 'orders'?  'jobs' : view;

  // Search & Filter States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');

  // Modals
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedInvoiceView, setSelectedInvoiceView] = useState(null);
  const [paymentCollectModal, setPaymentCollectModal] = useState(null); // invoice object
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState(5);
  const [restockCost, setRestockCost] = useState('');
  const [restockSelling, setRestockSelling] = useState('');
  const [inspectPart, setInspectPart] = useState(null);

  // Technician task editing state
  const [editingTechTask, setEditingTechTask] = useState(null);
  const [techTaskInput, setTechTaskInput] = useState('');

  // Form States
  const [newPart, setNewPart] = useState({
    name: '',
    category: 'Displays',
    stockQty: 5,
    minThreshold: 2,
    costPrice: '',
    sellingPrice: '',
    sku: '',
    image: ''
  });

  const [newTech, setNewTech] = useState({
    name: '',
    phone: '',
    specialty: 'Screen & Battery Replacement'
  });


  // Invoice Builder State
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerPhone: '',
    bookingId: '',
    deviceInfo: '',
    items: [{ name: '', qty: 1, rate: 0, isInventoryPart: false }],
    discount: 0,
    paidAmount: 0,
    costTotal: '',
    paymentMode: 'UPI (QR Code)'
  });

  // Editing a job status/technician
  const [editingJob, setEditingJob] = useState(null);
  const [jobNextStatus, setJobNextStatus] = useState('');
  const [jobAssignedTech, setJobAssignedTech] = useState('');

  // ---------------- COMPUTED METRICS ----------------
  const totalBilled = invoices.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalDues = invoices.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
  const lowStockCount = inventory.filter((it) => it.stockQty <= it.minThreshold).length;

  // Calculate Net Profit Earned across all invoices (Sales minus Wholesale Parts Cost)
  const totalNetProfit = invoices.reduce((acc, inv) => {
    let partsWholesaleCost = 0;
    inv.items?.forEach((item) => {
      const match = inventory.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (match) {
        partsWholesaleCost += (match.costPrice || 0) * (item.qty || 1);
      }
    });
    const invProfit = Math.max(0, (inv.grandTotal || 0) - partsWholesaleCost);
    return acc + invProfit;
  }, 0);

  // Total Capital Invested in Stock Inventory
  const totalStockInvestment = inventory.reduce((acc, item) => acc + item.costPrice * item.stockQty, 0);

  // Filtered Inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.sku?.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCat = inventoryCategory === 'All' || item.category === inventoryCategory;
    return matchesQuery && matchesCat;
  });

  // Filtered Bookings
  const filteredBookings = bookings.filter(b=>orderStageMatches(b,jobFilter));

  // ---------------- HANDLERS ----------------
  const handlePartImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPart((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJobUpdate = (jobId) => {
    updateBookingStatus(jobId, jobNextStatus, undefined, jobAssignedTech);
    setEditingJob(null);
  };

  const handleCreatePart = (e) => {
    e.preventDefault();
    addInventoryItem({shopId:currentShop.id,
      ...newPart,
      sku: newPart.sku || `SKU-${Date.now().toString().slice(-4)}`
    });
    setShowAddPartModal(false);
    setNewPart({
      name: '',
      category: 'Displays',
      stockQty: 5,
      minThreshold: 2,
      costPrice: '',
      sellingPrice: '',
      sku: '',
      image: ''
    });
  };

  const handleCreateTech = (e) => {
    e.preventDefault();
    addTechnician({...newTech,shopId:currentShop.id});
    setShowAddTechModal(false);
    setNewTech({ name: '', phone: '', specialty: 'Screen & Battery Replacement' });
  };


  // Invoice calculations
  const invoiceSubtotal = invoiceForm.items.reduce((acc, item) => acc + item.qty * (item.rate || 0), 0);
  const invoiceGrandTotal = Math.max(0, invoiceSubtotal - (parseFloat(invoiceForm.discount) || 0) + (parseFloat(invoiceForm.tax)||0));
  const invoiceDueAmount = Math.max(0, invoiceGrandTotal - (parseFloat(invoiceForm.paidAmount) || 0));

  const handleAddItemToInvoice = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', qty: 1, rate: 0, isInventoryPart: false }]
    }));
  };

  const handleSelectInventoryPartForInvoice = (index, partName) => {
    const found = inventory.find((it) => it.name === partName);
    setInvoiceForm((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        name: partName,
        qty: 1,
        rate: found ? found.sellingPrice : 0,
        isInventoryPart: true
      };
      return { ...prev, items: updated };
    });
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    const created = createInvoice({shopId:currentShop.id,
      bookingId: invoiceForm.bookingId || null,
      customerName: invoiceForm.customerName,
      customerPhone: invoiceForm.customerPhone,
      deviceInfo: invoiceForm.deviceInfo || 'Walk-in Repair Service',
      items: invoiceForm.items.filter((it) => it.name.trim() !== ''),
      subtotal: invoiceSubtotal,
      discount: parseFloat(invoiceForm.discount) || 0,
      grandTotal: invoiceGrandTotal,
      ...(invoiceForm.costTotal!==undefined&&invoiceForm.costTotal!==''?{costTotal:Number(invoiceForm.costTotal)}:{}),
      paidAmount: parseFloat(invoiceForm.paidAmount) || 0,
      dueAmount: invoiceDueAmount,
      paymentMode: invoiceForm.paymentMode,
      isGstInvoice: Boolean(invoiceForm.isGstInvoice),tax:Number(invoiceForm.tax||0),
      paymentStatus: invoiceDueAmount === 0 ? 'Fully Paid' : 'Partially Paid'
    });

    if(!created)return;
    setShowCreateInvoiceModal(false);
    setSelectedInvoiceView(created);
  };

  const handleSettleDuePayment = (e) => {
    e.preventDefault();
    const additional = parseFloat(e.target.amount.value) || 0;
    if(!approveOrRecordPayment(paymentCollectModal.id, additional))return;
    setPaymentCollectModal(null);
  };

  if(currentShop&&view==='inventory')return <InventoryWorkspace shop={currentShop}/>;
  if(!currentShop)return <div className="sv-page"><h1>{tr('Seller Dashboard')}</h1><p>{tr('No shop is linked to this account.')}</p><Link className="sv-button" to="/register-shop">{tr('Register your shop')}</Link></div>;
  if(view==='services')return <ServiceWorkspace shop={currentShop}/>;
  return (
    <div className={'workspace-page seller-orders-page '+(view==='billing'?'seller-finance-page':view==='orders'?'seller-orders-workspace':'page-workshop')+' min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6'}>
      
      {view==='orders'&&<header className="so-order-topbar"><h1>{tr('Orders')}</h1><AddRepairButton shop={currentShop} onSaved={()=>setJobFilter('All')}/></header>}
      {view!=='overview'&&view!=='billing'&&<>
      {view==='orders'?<div className="so-order-stages" role="group" aria-label={language==='hi'?'??????????':'Order stages'}>{ORDER_STAGES.map(([key,en,hi])=><button type="button" key={key} className={'so-stage so-stage-'+key.toLowerCase()} aria-pressed={jobFilter===key} onClick={()=>setJobFilter(key)}><span>{language==='hi'?hi:en}</span><strong>{bookings.filter(job=>orderStageMatches(job,key)).length}</strong></button>)}</div>:view==='inventory'?<div className="so-metrics" aria-label={language==='hi'?'स्टॉक की जानकारी':'Stock summary'}>{[
        [language==='hi'?'पार्ट्स की किस्में':'Spare part types',inventory.length],
        [language==='hi'?'कुल स्टॉक यूनिट':'Units in stock',inventory.reduce((sum,item)=>sum+Math.max(0,Number(item.stockQty)||0),0)],
        [language==='hi'?'कम स्टॉक वाले पार्ट्स':'Low-stock parts',lowStockCount],
        [language==='hi'?'स्टॉक की लागत':'Stock cost value',new Intl.NumberFormat(language==='hi'?'hi-IN':'en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(totalStockInvestment)]
      ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>:<>      {/* ================= ERP FINANCIAL & OPERATIONS METRICS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>{tr("Total Sales Billed")}</span>
            <Receipt className="w-3.5 h-3.5 text-blue-500" />
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{tr(totalBilled.toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">₹{tr(totalCollected.toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}{tr(" Received")}</p>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
          <span className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>{tr("Net Profit Earned")}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="text-xl font-black text-emerald-600 mt-1 font-mono">
            ₹{tr(totalNetProfit.toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">
            {tr(totalBilled > 0 ? `${(totalNetProfit / totalBilled * 100).toFixed(0)}% Margin` : 'Pure Margin')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/40">
          <span className="text-xs font-semibold text-amber-700 flex items-center justify-between">
            <span>{tr("Customer Dues")}</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="text-xl font-black text-amber-600 mt-1 font-mono">
            ₹{tr(totalDues.toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}
          </div>
          <p className="text-xs text-amber-700 font-medium mt-0.5">{tr("Unpaid customer balance")}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>{tr("Active Repairs")}</span>
            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
          </span>
          <div className="text-xl font-black text-indigo-600 mt-1 font-mono">
            {tr(bookings.length)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{tr(technicians.length)}{tr(" Technicians Active")}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>{tr("Stock Inventory")}</span>
            <Package className="w-3.5 h-3.5 text-purple-500" />
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {tr(inventory.length)}{tr(" Items")}
          </div>
          <p className={`text-xs font-medium mt-0.5 ${lowStockCount > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
            {tr(lowStockCount > 0 ? `${lowStockCount} Parts on Low Stock` : `₹${totalStockInvestment.toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN'))} Stock Value`)}
          </p>
        </div>
      </div>

</>}
      </>}
      {/* ================= TAB 1: REPAIR JOB CARDS ================= */}
      {view==='overview'&&<SellerOverview shop={currentShop} inventory={inventory} technicians={technicians} bookings={bookings} invoices={invoices}/>}

      {tr(activeTab === 'jobs' &&
      <div className="so-orders space-y-4">
          <div className="so-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tr("Active Job Cards & Repair Orders")}</h2>
              <p className="text-xs text-slate-500">{language==='hi'?'रिपेयर की स्थिति देखें, टेक्नीशियन चुनें और ऑर्डर का बिल खोलें।':'Track repair progress, assign your team, and view order invoices.'}</p>
            </div>


          </div>

          <div className="compact-order-grid">{!filteredBookings.length&&<div className="so-empty">{language==='hi'?'????????????????????':'No orders match this filter.'}</div>}{filteredBookings.map(job=><CompactOrderCard key={job.id} job={job} shop={currentShop} invoice={invoices.find(i=>!cancelledInvoice(i)&&(i.bookingId===job.id||i.id===job.invoiceNumber))} onInvoice={setSelectedInvoiceView}/>)}</div>
        </div>)}

      {/* ================= TAB 2: INVENTORY & SPARE PARTS ================= */}
      {tr(activeTab === 'inventory' &&
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tr("Inventory & Spare Parts Stock")}</h2>
              <p className="text-xs text-slate-500">{tr("Track stock count, cost, selling price. Items are automatically deducted when added to invoices.")}

            </p>
            </div>

            <button
            onClick={() => setShowAddPartModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            
              <Plus className="w-4 h-4" />{tr("Add New Spare Part")}

          </button>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
              type="text"
              placeholder={tr("Search spare parts by name, SKU (e.g. OnePlus Screen, iPhone battery)...")}
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500" />
            
            </div>

            <select
            value={inventoryCategory}
            onChange={(e) => setInventoryCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-700">
            
              <option value="All">{tr("All Categories")}</option>
              <option value="Displays">{tr("Displays & Touch Panels")}</option>
              <option value="Batteries">{tr("Batteries & Power Units")}</option>
              <option value="Ports & PCBs">{tr("Ports & IC Sub-Boards")}</option>
              <option value="Consumables">{tr("Consumables & Pastes")}</option>
            </select>
          </div>

          {/* Inventory Grid with Interactive Hover & Scale Effect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tr(filteredInventory.map((item) => {
            const isLowStock = item.stockQty <= item.minThreshold;
            return (
              <div
                key={item.id}
                className={`group relative bg-white rounded-3xl border p-5 shadow-sm flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500 hover:scale-[1.03] hover:z-20 ${
                isLowStock ? 'border-red-300 bg-gradient-to-b from-white to-red-50/20' : 'border-slate-200'}`
                }>
                
                  <div>
                    {/* Top Header with Image & Inspect Button */}
                    <div className="flex gap-3.5 mb-3.5">
                      <div
                      onClick={() => setInspectPart(item)}
                      className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group-hover:border-blue-400 group-hover:shadow-md transition cursor-pointer"
                      title={tr("Click to Enlarge / Inspect")}>
                      
                        <img
                        src={item.image}
                        alt={tr(item.name)}
                        className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500" />
                      
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{tr(item.sku)}</span>
                          <button
                          type="button"
                          onClick={() => setInspectPart(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title={tr("Inspect Details in Full Modal")}>
                          
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4
                        onClick={() => setInspectPart(item)}
                        className="font-bold text-slate-900 text-xs leading-snug hover:text-blue-600 transition cursor-pointer line-clamp-2 mt-0.5">
                        
                          {tr(item.name)}
                        </h4>

                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                          {tr(item.category)}
                        </span>
                      </div>
                    </div>

                    {/* Pricing & Profit Grid with Hover Glow */}
                    <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 group-hover:bg-blue-50/40 rounded-2xl mb-3.5 border border-slate-100 group-hover:border-blue-200/80 transition-colors">
                      <div>
                        <span className="text-slate-400 block text-xs font-medium">{tr("Wholesale Cost")}</span>
                        <span className="font-mono font-bold text-slate-700">₹{tr(item.costPrice)}{tr(" / pc")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs font-medium">{tr("Customer Bill Rate")}</span>
                        <span className="font-mono font-bold text-blue-600">₹{tr(item.sellingPrice)}{tr(" / pc")}</span>
                      </div>

                      <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-extrabold flex items-center gap-1 group-hover:scale-105 transition-transform origin-left">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />{tr("Profit: +\u20B9")}
                        {tr(item.sellingPrice - item.costPrice)} ({tr(item.costPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(0) : 0)}%)
                        </span>
                        <span className="text-slate-500 font-mono text-xs font-semibold">{tr("Valuation: \u20B9")}
                        {tr((item.costPrice * item.stockQty).toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stock & Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-full ${
                    isLowStock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800'}`
                    }>{tr("Stock: ")}
                      {tr(item.stockQty)}{tr(" Units")}
                    </span>
                      {tr(isLowStock &&
                    <span className="text-xs text-red-600 font-bold block mt-0.5">{tr("Low Stock Alert!")}</span>)
                    }
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                      onClick={() => {
                        setRestockTarget(item);
                        setRestockQty(5);
                        setRestockCost(item.costPrice);
                        setRestockSelling(item.sellingPrice);
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition flex items-center gap-1 shadow-sm"
                      title={tr("Add new batch of stock with updated wholesale/selling rate")}>
                      
                        <RefreshCw className="w-3 h-3" />{tr("Restock")}

                    </button>

                      <button
                      onClick={() => updateInventoryStock(item.id, item.stockQty - 1)}
                      className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm transition"
                      title={tr("Quick deduct 1 unit")}>
                      
                        -
                      </button>

                      <button
                      onClick={() => updateInventoryStock(item.id, item.stockQty + 1)}
                      className="w-7 h-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-sm transition"
                      title={tr("Quick add 1 unit")}>
                      
                        +
                      </button>
                    </div>
                  </div>
                </div>);

          }))}
          </div>
        </div>)}

      {/* ================= TAB 3: TECHNICIANS & FIELD GPS TRACKING ================= */}
      {tr(activeTab === 'technicians' &&
      <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tr("Technicians Roster & Live Status")}</h2>
              <p className="text-xs text-slate-500">{tr("Manage technician status, active tasks, and request their live GPS location \u2014 only when they are online.")}

            </p>
            </div>
            <button
            onClick={() => setShowAddTechModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            
              <Plus className="w-4 h-4" />{tr("Add Technician")}

          </button>
          </div>

          {/* Summary Bar */}
          <div className="grid grid-cols-3 gap-3">
            {tr([
          { label: 'In Shop', count: technicians.filter((t) => t.status === 'In Shop').length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'On Field', count: technicians.filter((t) => t.status === 'On Field Visit').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Available', count: technicians.filter((t) => t.status === 'Available').length, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' }].
          map((s) =>
          <div key={s.label} className={`rounded-2xl border p-3 text-center ${s.color}`}>
                <div className="text-2xl font-black">{tr(s.count)}</div>
                <div className="text-xs font-semibold mt-0.5">{tr(s.label)}</div>
              </div>
          ))}
          </div>

          {/* Technician Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tr(technicians.map((t) => {
            const isOnField = t.status === 'On Field Visit';
            const isInShop = t.status === 'In Shop';
            const isOnline = t.isOnline !== false; // treat as online by default for demo
            return (
              <div
                key={t.id}
                className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition-all hover:shadow-lg ${
                isOnField ? 'border-amber-300' : isInShop ? 'border-blue-200' : 'border-emerald-200'}`
                }>
                
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${
                      isOnField ? 'bg-amber-500' : isInShop ? 'bg-blue-600' : 'bg-emerald-500'}`
                      }>
                          {tr(t.name.charAt(0))}
                        </div>
                        {/* Online/Offline dot */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`
                      } title={tr(isOnline ? 'Online' : 'Offline')} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{tr(t.name)}</h4>
                        <p className="text-xs text-slate-400 font-medium">{tr(t.specialty)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                  isOnField ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  isInShop ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'}`
                  }>
                      {tr(isOnField ? "On Field" : isInShop ? "In Shop" : "Available")}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl p-2.5">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3 text-blue-500" />
                      {t.phone}
                    </span>
                    <span className="font-bold text-emerald-700"> {tr(t.rating)} • {tr(t.completedJobs)}{tr(" jobs")}</span>
                  </div>

                  {/* Active Task / Current Job */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{tr("Current Task")}</p>
                    {tr(editingTechTask === t.id
                  ? <div className="flex gap-1.5">
                        <input
                      type="text"
                      value={techTaskInput}
                      onChange={(e) => setTechTaskInput(e.target.value)}
                      placeholder={tr("e.g. Diagnosing iPhone BK-9021")}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                    
                        <button
                      onClick={() => {
                        updateTechnicianLocation(t.id, t.currentLocation?.area, t.currentLocation?.lat, t.currentLocation?.lng, t.status, techTaskInput);
                        setEditingTechTask(null);
                        setTechTaskInput('');
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">{tr("Save")}
                    </button>
                        <button onClick={() => setEditingTechTask(null)} className="px-2 text-slate-400 hover:text-slate-700">✕</button>
                      </div> :

                  <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-700 font-medium">
                          {tr(t.activeTask || (t.activeJobId ? `Job #${t.activeJobId}` : 'No active task'))}
                        </span>
                        <button
                      onClick={() => {setEditingTechTask(t.id);setTechTaskInput(t.activeTask || '');}}
                      className="text-xs text-blue-600 hover:underline">{tr("Edit")}
                    </button>
                      </div>)}
                  </div>

                  {/* Status Changer */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{tr("Update Status")}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {tr(['In Shop', 'On Field Visit', 'Available'].map((s) =>
                    <button
                      key={s}
                      onClick={() => updateTechnicianLocation(t.id, t.currentLocation?.area, t.currentLocation?.lat, t.currentLocation?.lng, s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      t.status === s
                      ? 'bg-slate-900 text-white border-slate-900' :
                      'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`
                      }>
                      
                          {tr(s)}
                        </button>
                    ))}
                    </div>
                  </div>

                  {/* Current Location */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Location")}</span>
                      <span className="text-xs text-slate-400">{tr(t.currentLocation?.lastUpdated || 'Unknown')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{tr(t.currentLocation?.area || 'Location not set')}</span>
                    </div>
                    {tr(t.currentLocation?.lat &&
                  <div className="text-xs font-mono text-slate-400">
                        {tr(t.currentLocation.lat.toFixed(4))}{tr("\xB0 N, ")}{tr(t.currentLocation.lng.toFixed(4))}{tr("\xB0 E")}
                  </div>)}

                    {/* Live Location Button */}
                    {tr(isOnline
                  ? <button
                    onClick={() => {
                      if (!navigator.geolocation) {
                        alert(tr('Browser location not supported.'));
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const { latitude, longitude } = pos.coords;
                          updateTechnicianLocation(
                            t.id,
                            `Live GPS (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`,
                            latitude,
                            longitude,
                            t.status
                          );
                        },
                        () => alert(tr('Location access denied. Please allow location in browser.'))
                      );
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
                    
                        <Navigation className="w-3.5 h-3.5" />{tr(" Get Live Location (Browser GPS)")}

                  </button> :

                  <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold border border-slate-200">{tr(" Offline — Location Unavailable")}

                  </div>)}
                  </div>

                  {/* Mark Online / Offline (simulates login state) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {tr(isOnline ? "Technician is Online" : "Technician is Offline")}
                    </span>
                    <button
                    onClick={() => {
                      setTechnicians((prev) => prev.map((tech) =>
                      tech.id === t.id ? { ...tech, isOnline: !isOnline } : tech
                      ));
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    isOnline
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`
                    }>
                    
                      {tr(isOnline ? 'Mark Offline' : 'Mark Online')}
                    </button>
                  </div>
                </div>);

          }))}
          </div>
        </div>)}

      {/* ================= TAB 4: BILLING, INVOICES & PAYMENT DUE TRACKING ================= */}
      {activeTab==='billing'&&<BillingWorkspace invoices={invoices} shop={currentShop} onView={setSelectedInvoiceView} onCollect={setPaymentCollectModal} onCreate={()=>{setInvoiceForm({customerName:'',customerPhone:'',bookingId:'',deviceInfo:'',items:[{name:'',qty:1,rate:0,isInventoryPart:false}],discount:0,paidAmount:0,costTotal:'',paymentMode:'UPI (QR Code)'});setShowCreateInvoiceModal(true);}}/>}

      {/* ================= MODAL 1: ADD NEW SPARE PART ================= */}
      {tr(showAddPartModal &&
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreatePart} className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />{tr("Add New Spare Part / Item to Inventory")}

            </h3>
              <button type="button" onClick={() => setShowAddPartModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{tr("Item / Component Name *")}</label>
                <input
                type="text"
                required
                placeholder={tr("e.g. Samsung S23 Ultra Original AMOLED Display")}
                value={newPart.name}
                onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500" />
              
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("Category")}</label>
                  <select
                  value={newPart.category}
                  onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  
                    <option value="Displays">{tr("Displays & Panels")}</option>
                    <option value="Batteries">{tr("Batteries & Power")}</option>
                    <option value="Ports & PCBs">{tr("Charging Ports / PCBs")}</option>
                    <option value="Consumables">{tr("Consumables & Pastes")}</option>
                    <option value="Accessories">{tr("Accessories")}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("SKU / Part Code")}</label>
                  <input
                  type="text"
                  placeholder={tr("e.g. DISP-S23U-OEM")}
                  value={newPart.sku}
                  onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono" />
                
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("Stock Quantity")}</label>
                  <input
                  type="number"
                  required
                  min="1"
                  value={newPart.stockQty}
                  onChange={(e) => setNewPart({ ...newPart, stockQty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono" />
                
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("Low Stock Alert Level")}</label>
                  <input
                  type="number"
                  required
                  min="1"
                  value={newPart.minThreshold}
                  onChange={(e) => setNewPart({ ...newPart, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono" />
                
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("Purchase Cost (\u20B9 Per Unit) *")}

                </label>
                  <input
                  type="number"
                  required
                  placeholder={tr("Wholesale rate e.g. 2500")}
                  value={newPart.costPrice}
                  onChange={(e) => setNewPart({ ...newPart, costPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono" />
                
                  <span className="text-xs text-slate-400 mt-0.5 block">{tr("Your wholesale purchase cost per piece")}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("Selling / Billing Price (\u20B9 Per Unit) *")}

                </label>
                  <input
                  type="number"
                  required
                  placeholder={tr("Customer rate e.g. 3800")}
                  value={newPart.sellingPrice}
                  onChange={(e) => setNewPart({ ...newPart, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono" />
                
                  <span className="text-xs text-slate-400 mt-0.5 block">{tr("What you bill the customer per piece")}</span>
                </div>
              </div>

              {/* Dynamic Live Profit & Margin Calculation Card */}
              {tr(newPart.costPrice && newPart.sellingPrice &&
            <div className={`p-3 rounded-xl border text-xs ${
            parseFloat(newPart.sellingPrice) >= parseFloat(newPart.costPrice)
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
            'bg-red-50/70 border-red-200 text-red-900'}`
            }>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />{tr("Profit Per Unit / Piece:")}

                </span>
                    <span className="font-mono text-sm">
                      {tr(parseFloat(newPart.sellingPrice) >= parseFloat(newPart.costPrice) ? '+' : '')}
                      ₹{tr((parseFloat(newPart.sellingPrice) - parseFloat(newPart.costPrice)).toFixed(0))}
                      {tr(' ')}({tr(parseFloat(newPart.costPrice) > 0 ? ((parseFloat(newPart.sellingPrice) - parseFloat(newPart.costPrice)) / parseFloat(newPart.costPrice) * 100).toFixed(1) : 0)}%)
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>{tr("Total Projected Profit on ")}{tr(newPart.stockQty || 0)}{tr(" Units:")}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{tr(((parseFloat(newPart.sellingPrice) - parseFloat(newPart.costPrice)) * (parseInt(newPart.stockQty, 10) || 0)).toFixed(0))}
                    </span>
                  </div>

                  {tr(parseFloat(newPart.sellingPrice) < parseFloat(newPart.costPrice) &&
              <p className="text-xs text-red-600 font-semibold mt-1">{tr(" Caution: Selling price is below wholesale cost! You will make a loss.")}

              </p>)
              }
                </div>)}

              {/* Real Image File Upload with Preview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{tr("Part Photo / Component Image")}

              </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/40 transition">
                    <UploadCloud className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      {tr(newPart.image ? 'Change Selected Image File' : 'Upload Image from Computer / Phone')}
                    </span>
                    <input
                    type="file"
                    accept="image/*"
                    onChange={handlePartImageUpload}
                    className="hidden" />
                  
                  </label>

                  {tr(newPart.image &&
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 relative shrink-0">
                      <img src={newPart.image} alt={tr("Preview")} className="w-full h-full object-cover" />
                    </div>)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
              type="button"
              onClick={() => setShowAddPartModal(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">{tr("Cancel")}


            </button>
              <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20">{tr("Save Spare Part")}


            </button>
            </div>
          </form>
        </div>)}

      {/* ================= MODAL 1.5: RESTOCK EXISTING PART WITH NEW LOT & COST ================= */}
      {tr(restockTarget &&
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
          onSubmit={(e) => {
            e.preventDefault();
            restockInventoryItem(restockTarget.id, restockQty, restockCost, restockSelling);
            setRestockTarget(null);
          }}
          className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
          
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{tr("Restock Existing Part (\u0928\u092F\u093E \u0932\u0949\u091F \u091C\u094B\u0921\u093C\u0947\u0902)")}

                </h3>
                  <p className="text-xs text-slate-500">{tr("Maintain same item without creating duplicate cards. Calculates weighted average cost.")}

                </p>
                </div>
              </div>
              <button type="button" onClick={() => setRestockTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Item Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-slate-700">
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>{tr(restockTarget.name)}</span>
                <span className="font-mono text-slate-400">{tr(restockTarget.sku)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{tr("Current Stock in Shop:")}</span>
                <span className="font-mono font-bold text-slate-800">{tr(restockTarget.stockQty)}{tr(" Pieces")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{tr("Old Purchase Wholesale Rate:")}</span>
                <span className="font-mono font-bold text-slate-800">₹{tr(restockTarget.costPrice)}{tr(" / Piece")}</span>
              </div>
            </div>

            {/* Restock Inputs */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("New Quantity Received (\u0915\u093F\u0924\u0928\u0947 \u092A\u0940\u0938 \u0906\u090F) *")}

                </label>
                  <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-blue-600 text-xs" />
                
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{tr("New Wholesale Rate (\u20B9 \u092A\u094D\u0930\u0924\u093F \u092A\u0940\u0938 \u0928\u092F\u093E \u092D\u093E\u0935) *")}

                </label>
                  <input
                  type="number"
                  required
                  placeholder={tr("e.g. 3200")}
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-indigo-600 text-xs" />
                
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{tr("Customer Billing Rate (\u20B9 \u0917\u094D\u0930\u093E\u0939\u0915 \u0915\u094B \u0928\u092F\u093E \u0930\u0947\u091F \u0915\u094D\u092F\u093E \u0932\u0917\u093E\u0928\u093E \u0939\u0948?)")}

              </label>
                <input
                type="number"
                required
                placeholder={tr("e.g. 4500")}
                value={restockSelling}
                onChange={(e) => setRestockSelling(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-600 text-xs" />
              
                <span className="text-xs text-slate-400 mt-0.5 block">
                  यदि होलसेलर से माल महँगा आया है, तो ग्राहक का सेलिंग रेट भी यहाँ अपडेट कर सकते हैं।
                </span>
              </div>

              {/* Real-time Weighted Average Calculation */}
              {tr(restockCost &&
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5 text-indigo-950">
                  <span className="font-bold text-xs text-indigo-900 block flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />{tr("Automatic Average Cost Calculation:")}

              </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-200/60">
                    <div>
                      <span className="text-slate-500 block">{tr("New Total Stock:")}</span>
                      <span className="font-mono font-extrabold text-slate-900 text-xs">
                        {tr(restockTarget.stockQty + (parseInt(restockQty, 10) || 0))}{tr(" Units")}
                  </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">{tr("New Average Cost/Piece:")}</span>
                      <span className="font-mono font-extrabold text-indigo-700 text-xs">
                        ₹{tr(Math.round((restockTarget.stockQty * restockTarget.costPrice + (parseInt(restockQty, 10) || 0) * (parseFloat(restockCost) || 0)) / (restockTarget.stockQty + (parseInt(restockQty, 10) || 0))))}{tr(" / pc")}
                  </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-indigo-200/40 flex justify-between items-center text-emerald-700 font-bold">
                      <span>{tr("Projected Profit Per Piece:")}</span>
                      <span className="font-mono text-xs">
                        +₹{tr(parseFloat(restockSelling) - Math.round((restockTarget.stockQty * restockTarget.costPrice + (parseInt(restockQty, 10) || 0) * (parseFloat(restockCost) || 0)) / (restockTarget.stockQty + (parseInt(restockQty, 10) || 0))))}
                      </span>
                    </div>
                  </div>
                </div>)}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
              type="button"
              onClick={() => setRestockTarget(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">{tr("Cancel")}


            </button>
              <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">{tr("Save Restock & Update Average Cost")}


            </button>
            </div>
          </form>
        </div>)}

      {/* ================= MODAL 2: ADD TECHNICIAN ================= */}
      {tr(showAddTechModal &&
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTech} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />{tr("Add New Technician")}

            </h3>
              <button type="button" onClick={() => setShowAddTechModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{tr("Technician Full Name *")}</label>
              <input
              type="text"
              required
              placeholder={tr("e.g. Deepak Verma")}
              value={newTech.name}
              onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{tr("Mobile Phone (For GPS Ping) *")}</label>
              <input
              type="tel"
              required
              placeholder={tr("10-digit number")}
              value={newTech.phone}
              onChange={(e) => setNewTech({ ...newTech, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{tr("Specialization / Expertise")}</label>
              <input
              type="text"
              required
              placeholder={tr("e.g. GPU Reballing & Motherboard Specialist")}
              value={newTech.specialty}
              onChange={(e) => setNewTech({ ...newTech, specialty: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
              type="button"
              onClick={() => setShowAddTechModal(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">{tr("Cancel")}


            </button>
              <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">{tr("Register Technician")}


            </button>
            </div>
          </form>
        </div>)}

      {/* ================= MODAL 3: CREATE BILL / INVOICE (AUTO CALC & INVENTORY UPDATE) ================= */}
      {showCreateInvoiceModal&&<Navigate to={'/shop/billing/new'+(invoiceForm.bookingId?'?job='+encodeURIComponent(invoiceForm.bookingId):'')}/> }

      {/* ================= MODAL 4: COLLECT REMAINING DUE PAYMENT ================= */}
      {tr(paymentCollectModal &&
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSettleDuePayment} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />{tr("Collect Due Payment - ")}
              {tr(paymentCollectModal.id)}
              </h3>
              <button type="button" onClick={() => setPaymentCollectModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{tr("Customer:")}</span>
                <span className="font-bold text-slate-800">{paymentCollectModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr("Grand Total:")}</span>
                <span className="font-mono font-bold text-slate-800">₹{tr(paymentCollectModal.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr("Already Paid:")}</span>
                <span className="font-mono font-bold text-emerald-600">₹{tr(paymentCollectModal.paidAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-amber-700">{tr("Remaining Balance:")}</span>
                <span className="font-mono font-black text-amber-600 text-sm">₹{tr(paymentCollectModal.dueAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{tr("Amount Being Paid Now (\u20B9):")}

            </label>
              <input
              type="number"
              name="amount"
              required
              defaultValue={paymentCollectModal.dueAmount}
              max={paymentCollectModal.dueAmount}
              min="1"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-600 text-sm" />
            
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
              type="button"
              onClick={() => setPaymentCollectModal(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">{tr("Cancel")}


            </button>
              <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20">{tr("Confirm Payment Received")}


            </button>
            </div>
          </form>
        </div>)}

      {/* ================= MODAL 5: PRINTABLE DIGITAL INVOICE RECEIPT ================= */}
      {selectedInvoiceView&&<BusinessDialog className="bc-dialog" title="Bill / Invoice" onClose={()=>setSelectedInvoiceView(null)}><InvoiceDocument invoice={selectedInvoiceView} shop={currentShop}/><CustomerInvoiceActions invoice={selectedInvoiceView} shop={currentShop} job={bookings.find(j=>j.id===selectedInvoiceView.bookingId)} showWhatsapp/><div className="bc-actions"><button className="biz-primary" onClick={()=>printInvoice(selectedInvoiceView,currentShop,{audience:'internal'})}>Print owner copy</button></div></BusinessDialog>}

      {/* ================= MODAL 7: ENLARGED PART DETAIL & SPECS INSPECTION ================= */}
      {tr(inspectPart &&
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 text-xs shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{tr(inspectPart.sku)}</span>
                <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{tr(inspectPart.name)}</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {tr(inspectPart.category)}
                </span>
              </div>
              <button
              type="button"
              onClick={() => setInspectPart(null)}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Resolution Photo Display */}
            <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
              src={inspectPart.image}
              alt={tr(inspectPart.name)}
              className="w-full h-full object-cover" />
            
            </div>

            {/* Detailed Profit & Pricing Breakdown */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-xs font-medium">{tr("Wholesale Purchase Cost")}</span>
                <span className="font-mono font-bold text-slate-800 text-sm">₹{tr(inspectPart.costPrice)}{tr(" / Piece")}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs font-medium">{tr("Customer Bill Rate")}</span>
                <span className="font-mono font-bold text-blue-600 text-sm">₹{tr(inspectPart.sellingPrice)}{tr(" / Piece")}</span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-semibold">{tr("Net Profit Per Piece:")}</span>
                <span className="font-mono font-extrabold text-emerald-600 text-sm">
                  +₹{tr(inspectPart.sellingPrice - inspectPart.costPrice)} ({tr(inspectPart.costPrice > 0 ? ((inspectPart.sellingPrice - inspectPart.costPrice) / inspectPart.costPrice * 100).toFixed(1) : 0)}{tr("% Margin)")}
              </span>
              </div>

              <div className="col-span-2 flex justify-between items-center text-xs text-slate-500">
                <span>{tr("Total Money Invested in this Stock:")}</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{tr((inspectPart.costPrice * inspectPart.stockQty).toLocaleString((language === 'hi' ? 'hi-IN' : 'en-IN')))}
                </span>
              </div>
            </div>

            {/* Stock Levels & Restock Info */}
            <div className="flex items-center justify-between text-xs p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div>
                <span className="text-slate-500 text-xs block">{tr("Current Stock Available:")}</span>
                <span className="font-black text-slate-900 text-sm font-mono">{tr(inspectPart.stockQty)}{tr(" Units")}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-xs block">{tr("Alert Threshold:")}</span>
                <span className="font-bold text-amber-700 font-mono text-xs">{tr(inspectPart.minThreshold)}{tr(" Units")}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
              type="button"
              onClick={() => setInspectPart(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold">{tr("Close")}


            </button>

              <button
              type="button"
              onClick={() => {
                const target = inspectPart;
                setInspectPart(null);
                setRestockTarget(target);
                setRestockQty(5);
                setRestockCost(target.costPrice);
                setRestockSelling(target.sellingPrice);
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20">
              
                <RefreshCw className="w-4 h-4" />{tr("Restock this Part")}

            </button>
            </div>
          </div>
        </div>)}

    </div>);

}

