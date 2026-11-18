import ShopUpiCard from './ShopUpiCard';
import DashboardDateFilter from './DashboardDateFilter';
import React,{useState} from 'react';
import {useLanguage} from '../../context/LanguageContext';
import {sellerStatus} from '../../utils/sellerVerification';
import {businessDate} from '../../utils/workshopOverview';
import {dashboardRange} from '../../utils/dashboardPeriod';
import {SellerAccountLayout,VerificationBadge} from './VerificationUI';
import '../../styles/seller-overview.css';
import '../../styles/dashboard-refresh.css';
export default function SellerOverview({shop,inventory=[],technicians=[],bookings=[],invoices=[],loading=false}){
 const {tr,language}=useLanguage(),[period,setPeriod]=useState('all'),[custom,setCustom]=useState(()=>({from:businessDate(new Date()),to:businessDate(new Date())}));
 const range=dashboardRange(period,custom);
 const date=value=>{const day=businessDate(value);return day?new Date(day+'T12:00:00Z').toLocaleDateString(language==='hi'?'hi-IN':'en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}):'—';};
 const periodLabel=period==='all'?tr('All time'):range.from===range.to?date(range.from):date(range.from)+' – '+date(range.to);
 return <SellerAccountLayout><div className="sd-overview sd-refreshed"><div className="sd-top-business"><header className="sd-heading"><div><h1>{shop?.shopName||tr('Seller Dashboard')}</h1><div className="sd-heading-meta"><VerificationBadge label={sellerStatus(shop)==='VERIFIED'?'Verified Seller':sellerStatus(shop)==='PENDING_REVIEW'?'Verification Pending':undefined} status={sellerStatus(shop)} date={shop?.businessProofReviewedAt}/><span>{shop?.locality}</span></div><p className="sd-shop-details">{[shop?.ownerName?tr('Owner')+': '+shop.ownerName:null,shop?.phone?tr('Phone')+': '+shop.phone:null].filter(Boolean).join(' · ')}</p></div></header><ShopUpiCard shop={shop}/></div>
 <DashboardDateFilter period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} range={range} periodLabel={periodLabel}/>
 </div></SellerAccountLayout>;
}
