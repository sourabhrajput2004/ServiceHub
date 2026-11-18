import {customerInvoice} from '../../utils/customerInvoice';
import {cancelledInvoice} from '../../utils/invoiceLifecycle';
import CustomerRepairRecords from './CustomerRepairRecords';
import {workStatus,repairTimeline} from '../../utils/orderFulfilment';
import CustomerOverview from './CustomerOverview';
import { useLanguage } from "../../context/LanguageContext";import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {Clock, CheckCircle2, FileText, Wrench, ShieldCheck, Download, Store, Search, Phone, MapPin, User, Copy, X, Printer, Navigation, AlertCircle, Package, CreditCard, MessageCircle} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { useSupport } from '../../context/SupportContext';
import '../../styles/customer-dashboard.css';
import '../../styles/repair-orders.css';

const isCompletedStatus = (status) =>
['Ready for Pickup','Completed','COMPLETED','PAID'].includes(status);

const formatRupee = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  const numeric = String(value).replace(/[^\d.]/g, '');
  if (!numeric) return String(value);
  return `₹${Number(numeric).toLocaleString('en-IN')}`;
};

export default function CustomerDashboard({ view = 'overview' }) {const { tr } = useLanguage();
  const { bookings, shops, invoices, technicians } = useShop();
  const { user } = useAuth();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [pickupAck, setPickupAck] = useState({});
  const [helpTicket, setHelpTicket] = useState(null);
  const { createThread } = useSupport();
  const openThread = id => { if (id) navigate(`/support?conversation=${encodeURIComponent(id)}`); };

  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(
      (b) => b.customerId === user.id
    );
  }, [bookings, user]);

  const activeRepairs = myBookings.filter((b) => !isCompletedStatus(b.status));
  const pastRepairs = myBookings.filter((b) => isCompletedStatus(b.status));

  const displayedList = (activeTab === 'active' ? activeRepairs : pastRepairs).filter((item) => {
    const haystack = `${item.id} ${item.deviceBrand} ${item.deviceType} ${item.shopName} ${item.issueType} ${item.status}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const copyBookingId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1600);
    } catch {
      setCopiedId('');
    }
  };

  const openInvoice = (booking) => {
    const invoice =
    invoices.find((inv) => !cancelledInvoice(inv)&&(inv.id === booking.invoiceNumber || inv.bookingId === booking.id)) || null;
    setViewInvoice({ booking, invoice });
  };

  if(view==='overview')return <CustomerOverview/>;
  if(view==='repairs')return <CustomerRepairRecords/>;
  return (
    <div className="workspace-page page-customer customer-repairs-workspace min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className={`customer-hero ${view === 'repairs' ? 'repairs-compact-hero' : ''} flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8`}>
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{tr("Welcome back, ")}
            {tr(user?.name || 'Customer')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{tr(view === "repairs" ? "My Repairs & Records" : "Your Repair Hub")}

          </h1>
          <p className="text-sm text-slate-600 mt-1">{tr("Track live jobs, talk to your assigned shop, and keep invoices for warranty claims.")}

          </p>
        </div>

        <Link
          to="/find-shop"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition">
          
          <Wrench className="w-4 h-4" />{tr("Book Repair")}

        </Link>
      </div>

      {view === 'repairs' && <>
      <div id="repair-orders" className="repair-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="repair-tabs flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('active')}
            aria-pressed={activeTab === 'active'}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'active'
            ? 'border-blue-600 text-blue-600' :
            'border-transparent text-slate-500 hover:text-slate-800'}`
            }>
            
            <Clock className="w-4 h-4" />{tr("Active Repair Orders (")}
            {tr(activeRepairs.length)})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            aria-pressed={activeTab === 'history'}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'history'
            ? 'border-blue-600 text-blue-600' :
            'border-transparent text-slate-500 hover:text-slate-800'}`
            }>
            
            <FileText className="w-4 h-4" />{tr("Past Service Records (")}
            {tr(pastRepairs.length)})
          </button>
        </div>

        <div className="repair-search relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={tr("Search booking ID, device or shop")}
            placeholder={tr("Search repairs...")}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          
        </div>
      </div>

      <div className="space-y-5">
        {tr(displayedList.map((item) => {
          const shop = shops.find((s) => s.id === item.shopId);
          const tech = technicians.find((t) => t.id === item.assignedTechId);
          const invoice = invoices.find((inv) => inv.id === item.invoiceNumber || inv.bookingId === item.id);
          const steps = repairTimeline(item);
          const doneCount = steps.filter((s) => s.done).length;
          const progress = steps.length?  Math.round(doneCount / steps.length * 100) : 0;
          const currentStep = [...steps].reverse().find((s) => s.done) || steps[0];
          const expanded = expandedId === item.id;
          const mapsUrl = shop?.coordinates ?
          `https://www.google.com/maps?q=${shop.coordinates.lat},${shop.coordinates.lng}` :
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.shopName + ' Ghaziabad')}`;

          return (
            <article
              key={item.id}
              className="repair-order-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              <div className="repair-card-body p-5 sm:p-6 space-y-5">
                <div className="repair-card-header flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="repair-booking-meta flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyBookingId(item.id)}
                        className="font-mono text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5"
                        title={tr("Copy booking ID")}>
                        
                        {tr(item.id)}
                        <Copy className="w-3 h-3" />
                      </button>
                      {tr(copiedId === item.id &&
                      <span className="text-xs font-semibold text-emerald-600">{tr("Copied")}</span>)
                      }
                      <span className="text-xs text-slate-400">{tr("Booked on ")}{tr(item.bookingDate)}</span>
                    </div>
                    <h3 className="repair-device-title text-lg font-bold text-slate-900 mt-1.5">
                      {item.deviceBrand} ({tr(item.deviceType)})
                    </h3>
                    <p className="repair-workshop text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      {item.shopName}
                      {tr(shop?.locality ? <span className="text-slate-400">• {tr(shop.locality)}</span> : null)}
                    </p>
                  </div>

                  <div className="repair-cost-summary flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                    <span className={`repair-status-badge text-xs font-bold px-2.5 py-1 rounded-full ${statusTone(item.status)}`}>
                      {tr(workStatus(item))}
                    </span>
                    <div className="repair-price text-right">
                      <span className="text-xs font-semibold text-slate-500 block">{tr("Estimated cost")}</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {tr(item.estimatedCost)}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    invoice?.paymentStatus === 'Fully Paid' || item.isPaid
? 
                    'bg-emerald-100 text-emerald-700' :
                    invoice?.paymentStatus === 'Partially Paid'
? 
                    'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-600'}`
                    }>
                      {tr(invoice?.paymentStatus || (item.isPaid ? 'PAID' : 'PAY ON DELIVERY'))}
                    </span>
                  </div>
                </div>

                <div className="repair-progress-section">
                  <div className="repair-progress-heading flex items-center justify-between mb-2">
                    <p className="repair-progress-label">{tr('Repair progress')} <span>{progress}%</span></p>
                    <p className="text-xs text-slate-500">{tr("Current: ")}
                      <span className="font-semibold text-slate-800">{tr(workStatus(item))}</span>
                    </p>
                  </div>
                  <div className="repair-progress-track h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label={tr("Repair progress")} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                      style={{ width: `${progress}%` }} />
                    
                  </div>
                </div>

                <div className="repair-timeline">
                  {tr(steps.map((step, idx) => {
                    const isCurrent = currentStep?.step === step.step && step.done && !isCompletedStatus(item.status);
                    return (
                      <div
                        key={`${item.id}-step-${idx}`}
                        className={`repair-step ${isCurrent ? 'is-current' : step.done ? 'is-done' : 'is-pending'} p-2.5 rounded-xl border text-left ${
                        isCurrent
? 
                        'bg-blue-600 border-blue-600 text-white shadow-sm' :
                        step.done
? 
                        'bg-blue-50/80 border-blue-200 text-blue-900' :
                        'bg-slate-50 border-slate-100 text-slate-400'}`
                        }>
                        
                        <div className="repair-step-marker flex items-center gap-1 mb-1">
                          {tr(step.done
? 
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-blue-600'}`} /> :

                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />)
                          }
                          <span className="text-xs font-bold">{tr("Step ")}{tr(idx + 1)}</span>
                        </div>
                        <span className="repair-step-title text-xs font-semibold leading-tight block">{tr(step.step)}</span>
                        <span className={`repair-step-time text-xs mt-1 block ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                          {tr(step.timestamp || 'Pending')}
                        </span>
                      </div>);

                  }))}
                </div>

                <div className="repair-card-actions flex flex-wrap gap-2">
                  {tr(shop?.phone &&
                  <a
                    href={`tel:${shop.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition">
                    
                      <Phone className="w-3.5 h-3.5" />{tr("Call shop")}

                  </a>)
                  }
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition">
                    
                    <Navigation className="w-3.5 h-3.5" />{tr("Shop location")}

                  </a>
                  <button
                    type="button"
                    onClick={() => setHelpTicket(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition">
                    
                    <MessageCircle className="w-3.5 h-3.5" />{tr("Need help")}

                  </button>
                  <button type="button" onClick={() => openThread(createThread(item, `Chat about ${item.deviceBrand}`, '', 'chat'))} className="repair-live-chat inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700"><MessageCircle className="w-4 h-4" />{tr("Live chat")}</button>
                  {tr((item.invoiceNumber || invoice) &&
                  <button
                    type="button"
                    onClick={() => openInvoice(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition">
                    
                      <Download className="w-3.5 h-3.5" />{tr("View invoice")}

                  </button>)
                  }
                  {tr(item.status === 'Ready for Pickup' &&
                  <button
                    type="button"
                    onClick={() => setPickupAck((prev) => ({ ...prev, [item.id]: true }))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition">
                    
                      {tr(pickupAck[item.id] ? 'Shop notified — collect today' : 'I am coming to collect')}
                    </button>)
                  }
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    aria-expanded={expanded}
                    aria-controls={`repair-details-${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50 transition ml-auto">
                    
                    {tr(expanded ? 'Hide details' : 'Job details')}
                    
                  </button>
                </div>
              </div>

              {tr(expanded &&
              <div id={`repair-details-${item.id}`} className="repair-expanded-details px-5 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-4 bg-slate-50/70">
                  <DetailBlock title={tr("Issue reported")}>
                    <p className="font-semibold text-slate-800">{tr(item.issueType)}</p>
                    {item.description&&<p className="mt-1"><strong>{tr('Problem')}:</strong> {item.description}</p>}
                    <p className="mt-2 text-slate-500">{tr("Handover: ")}{tr(item.preferredSlot)}</p>
                  </DetailBlock>
                  <DetailBlock title={tr("Assigned technician")} >{item.estimatedArrivalAt&&<p>Expected arrival: {new Date(item.estimatedArrivalAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</p>}
                    {tr(tech || item.assignedTechName
? 
                  <>
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {tr(tech?.name || item.assignedTechName)}
                        </p>
                        <p className="mt-1">{tr(tech?.specialty || 'Workshop technician')}</p>
                        <p className="mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {tr(tech?.currentLocation?.area || 'At assigned shop')}
                        </p>
                        {tr(tech?.phone &&
                    <a href={`tel:${tech.phone}`} className="inline-flex items-center gap-1 mt-2 font-semibold text-blue-700">
                            <Phone className="w-3 h-3" /> {tech.phone}
                          </a>)
                    }
                      </> :

                  <p>{tr("Technician will be assigned after diagnosis.")}</p>)
                  }
                  </DetailBlock>
                  <DetailBlock title={tr("Payment snapshot")}>
                    {tr(invoice
? 
                  <>
                        <p>{tr("Invoice ")}{tr(invoice.id)}</p>
                        <p className="mt-1 font-semibold text-slate-800">{tr("Total ")}{tr(formatRupee(invoice.grandTotal))}</p>
                        <p>{tr("Paid ")}{tr(formatRupee(invoice.paidAmount))}{tr(" \u2022 Due ")}{tr(formatRupee(invoice.dueAmount))}</p>
                        <p className="mt-1 text-slate-500">{tr(invoice.paymentMode)}</p>
                      </> :

                  <p>{tr("Final bill will appear here after the shop completes QC and generates an invoice.")}</p>)
                  }
                  </DetailBlock>
                </div>)
              }
            </article>);

        }))}

        {tr(displayedList.length === 0 &&
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {tr(query
? 
            'No matching repair found' :
            `No ${activeTab === 'active' ? 'active repairs' : 'past repair records'} yet`)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {tr(query
? 
            'Try another booking ID, device name, or shop.' :
            activeTab === 'active'
? 
            'Book a verified shop to start a live job card you can track from this dashboard.' :
            'Completed jobs and invoices stay here for warranty claims.')}
            </p>
            <Link
            to="/find-shop"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">{tr("Find a shop")}


          </Link>
          </div>)
        }
      </div>

      </>}
      {tr(viewInvoice &&
      <InvoiceModal
        booking={viewInvoice.booking}
        invoice={viewInvoice.invoice}
        onClose={() => setViewInvoice(null)} />)

      }

      {tr(helpTicket &&
      <HelpModal booking={helpTicket} onClose={() => setHelpTicket(null)} onCreated={(id) => {setHelpTicket(null);openThread(id);}} />)
      }
    </div>);

}

function statusTone(status) {
  if (status === 'Ready for Pickup' || status === 'Completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Diagnosing Issue' || status === 'Waiting for Parts') return 'bg-amber-100 text-amber-800';
  return 'bg-blue-100 text-blue-800';
}

function DetailBlock({ title, children }) {const { tr } = useLanguage();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{tr(title)}</p>
      {tr(children)}
    </div>);

}

function InvoiceModal({ booking, invoice, onClose }) {const { tr } = useLanguage();
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{tr("Digital invoice")}</p>
            <p className="text-xs text-slate-500">{tr(invoice?.id || booking.invoiceNumber || 'Pending')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-900">{booking.shopName}</p>
              <p className="text-slate-500 mt-0.5">{booking.customerName} • {booking.customerPhone}</p>
              <p className="text-slate-500">{booking.deviceBrand} ({tr(booking.deviceType)})</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />{tr(" Verified job card")}
            </span>
          </div>

          {tr(invoice
? 
          <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {tr(customerInvoice(invoice).services.map((row) =>
              <div key={row.name} className="flex justify-between px-3 py-2 border-b border-slate-100 last:border-0">
                    <span>{tr(row.name)} × {tr(row.qty)}</span>
                    
                  </div>
              ))}
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                  <span>{tr("Grand total")}</span><span>{tr(formatRupee(invoice.grandTotal))}</span>
                </div>
                
              </div>
            </> :

          <div className="p-4 rounded-xl bg-slate-50 text-slate-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />{tr("Invoice will be generated after the shop completes repair and QC.")}

          </div>)
          }
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            
            <Printer className="w-3.5 h-3.5" />{tr("Print / Save PDF")}

          </button>
        </div>
      </div>
    </div>);

}

function HelpModal({ booking, onClose, onCreated }) {const { tr } = useLanguage();
  const { createThread, error } = useSupport();
  const [selectedIssue, setSelectedIssue] = useState('Same issue reoccurred / Problem not fixed');
  const [customNotes, setCustomNotes] = useState('');

  const COMMON_ISSUES = [
  'Same issue reoccurred / Problem not fixed',
  'Display touch glitch or screen flickering',
  'Battery draining fast or heating up',
  'Parts or physical fitting issue',
  'Delay in repair / Want live timeline update',
  'Invoice / Billing or payment discrepancy',
  'Other issue (Specify details below)'];


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <MessageCircle className="w-4 h-4" />
              </span>{tr("Support Ticket & Assistance")}

            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{tr("Service Order: ")}
              <strong className="text-slate-800">{tr(booking.id)}</strong> • {booking.deviceBrand}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {tr(<form
          onSubmit={(e) => {
            e.preventDefault();
            const id = createThread(booking, selectedIssue, customNotes);
            if (id) onCreated(id);
          }}
          className="mt-4 space-y-4 text-xs">
          
            {tr(error && <p role="alert" className="text-red-600">{tr(error)}</p>)}
            {/* Shop Summary Header */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">{tr("Assigned Workshop")}</span>
                <span className="font-bold text-slate-800 text-xs">{booking.shopName}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {tr(workStatus(booking))}
              </span>
            </div>

            {/* Common Reasons Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">{tr("Select the primary issue / reason for assistance: *")}

            </label>
              <div className="space-y-1.5">
                {tr(COMMON_ISSUES.map((issue) =>
              <label
                key={issue}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                selectedIssue === issue
? 
                'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-sm' :
                'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`
                }>
                
                    <input
                  type="radio"
                  name="issueReason"
                  value={issue}
                  checked={selectedIssue === issue}
                  onChange={() => setSelectedIssue(issue)}
                  className="text-blue-600 focus:ring-blue-500" />
                
                    <span>{tr(issue)}</span>
                  </label>
              ))}
              </div>
            </div>

            {/* Custom Notes / Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">{tr("Additional Details / Description (Optional or if choosing Other):")}

            </label>
              <textarea
              rows={3}
              required={selectedIssue.startsWith('Other')}
              maxLength={4000}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={tr("Explain the problem in detail (e.g. green line visible after drop, battery dropping from 50% to 10%, etc.)...")}
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition">{tr("Cancel")}


            </button>
              <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5">
              
                <MessageCircle className="w-3.5 h-3.5" />{tr("Submit Support Request")}

            </button>
            </div>
          </form>)
        }
      </div>
    </div>);

}
