import {matchesShopCategory} from '../../utils/shopCategories';
import ShopDirectoryCard from '../../components/customer/ShopDirectoryCard';
import { useLanguage } from "../../context/LanguageContext";import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {Search, MapPin, Star, ShieldCheck, Phone, Filter, Wrench, Navigation, Lock} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import BookRepairModal from './BookRepairModal';
import DocumentProof from '../../components/common/DocumentProof';
import LocationSearch from '../../components/common/LocationSearch';
import { SERVICE_AREAS, nearestShops } from '../../utils/nearbyShops';
import { googleDirectionsUrl } from '../../utils/googleDirections';

const CATEGORIES = ['All Devices', 'Mobile Phones', 'Laptops & Computers', 'Home Appliances', 'TV & Audio'];

export default function FindShop() {const { tr } = useLanguage();
  const { shops } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const [searchTerm, setSearchTerm] = useState(params.get('q') || '');
  const [origin, setOrigin] = useState(() => SERVICE_AREAS.find(area => area.label === params.get('locality')) || null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.includes(params.get('category')) ? params.get('category') : 'All Devices');
  const [selectedShopForBooking, setSelectedShopForBooking] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(location.search);
    setSearchTerm(next.get('q') || '');
    setOrigin(SERVICE_AREAS.find(area => area.label === next.get('locality')) || null);
    setSelectedCategory(CATEGORIES.includes(next.get('category')) ? next.get('category') : 'All Devices');
  }, [location.search]);

  // Filter only approved shops for customers
  const approvedShops = shops.filter((shop) => shop.verificationStatus === 'approved');

  const matchingShops = approvedShops.filter((shop) => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.services?.some((s) => {
      const name = typeof s === 'object'?  s.name : s;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const matchesCategory = matchesShopCategory(shop,selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const filteredShops = nearestShops(matchingShops, origin);

  const handleOpenBooking = (shop) => {
    if (!user) {
      // Prompt unauthenticated visitor to login or register first
      navigate('/login', {
        state: {
          from: location,
          message: `Please sign in or create an account to book a repair ticket with ${shop.shopName}.`,
          preferredRole: 'customer'
        }
      });
      return;
    }
    setSelectedShopForBooking(shop);
  };

  return (
    <div className={(user?.role==='customer'?'customer-directory ':'')+"workspace-page page-directory min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"}>
      {/* Page Header */}
      <div className="directory-heading">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{tr('Repair shops in Ghaziabad')}

        </h1>
        <p className="text-sm text-slate-600 mt-2">{tr('Find a shop by device, service or neighbourhood.')}

        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="directory-filters bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={tr("Search shops or repairs")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-blue-500">
              
              {tr(CATEGORIES.map((cat) =>
              <option key={cat} value={cat}>{tr(cat)}</option>
              ))}
            </select>
          </div>
        </div>

        <LocationSearch shops={approvedShops} origin={origin} onChange={setOrigin} />

      </div>

      {/* Shop Cards Grid */}
      <div className="shop-directory-grid grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredShops.map(shop=><ShopDirectoryCard key={shop.id} shop={shop} origin={origin} onBook={handleOpenBooking}/>)}
      </div>

      {tr(filteredShops.length === 0 &&
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 mt-6">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">{tr("No verified shops found in this filter")}</h3>
          <p className="text-xs text-slate-500 mt-1">{tr("Try another device category or search keyword.")}</p>
        </div>)
      }

      {/* Booking Modal (Only accessible if logged in) */}
      {tr(selectedShopForBooking && user &&
      <BookRepairModal
        shop={selectedShopForBooking}
        onClose={() => setSelectedShopForBooking(null)} />)

      }
    </div>);

}
