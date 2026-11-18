import PageReveal from '../components/common/PageReveal';
import RepairCarousel from '../components/common/RepairCarousel';
import HomeRepairPreview from '../components/common/HomeRepairPreview';
import { useLanguage } from "../context/LanguageContext";import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {Smartphone, Laptop, Tv, Wrench, MapPin, Search, ShieldCheck, Store, CircleCheck, FileText} from 'lucide-react';
import '../styles/marketing.css';
const devices = [
{ name: 'Smartphone', category: 'Mobile Phones', icon: Smartphone, issue: 'Screen, battery & more', color: 'blue' },
{ name: 'Laptop & PC', category: 'Laptops & Computers', icon: Laptop, issue: "Hardware and software repairs", color: 'purple' },
{ name: 'TV & Audio', category: 'TV & Audio', icon: Tv, issue: "Display and audio repairs", color: 'orange' },
{ name: 'Home appliances', category: 'Home Appliances', icon: Wrench, issue: "Appliance servicing and repairs", color: 'green' }];

export default function Home() {const { tr } = useLanguage();
  const navigate = useNavigate();
  const [device, setDevice] = useState(0);
  const [area, setArea] = useState('All Ghaziabad');
  const findShops = (category = devices[device].category) => navigate(`/find-shop?${new URLSearchParams({ category, locality: area })}`);
  return <div className="marketing home-page"><PageReveal/>
    <section className="home-hero"><div className="marketing-wrap hero-layout">
      <div className="hero-copy"><span className="eyebrow">{tr("Device repairs in Ghaziabad")}</span>
        <h1>{tr("Find repair services")}<br /><span>{tr("in Ghaziabad.")}</span></h1>
        <p>{tr("Find a shop, book a repair and track its progress.")}</p>
      </div><div className="hero-finder-column"><div className="repair-finder"><p className="finder-label">{tr("WHAT CAN WE HELP YOU FIX?")}</p>
          <div className="device-switch" aria-label={tr("Choose your device")}>{tr(devices.map((d, i) => <button key={d.name} type="button" aria-pressed={device === i} onClick={() => setDevice(i)} className={device === i ? 'selected' : ''}><d.icon size={17} /><span>{tr(['Phone', 'Laptop', 'TV & Audio', 'Appliances'][i])}</span></button>))}</div>
          <form className="finder-bottom" onSubmit={(e) => {e.preventDefault();findShops();}}>
            <label className="location-select"><MapPin size={19} /><span><span className="field-caption">{tr("YOUR NEIGHBOURHOOD")}</span><select aria-label={tr("Your neighbourhood")} value={area} onChange={(e) => setArea(e.target.value)}>{tr(['All Ghaziabad', 'RDC, Raj Nagar', 'Indirapuram', 'Vaishali', 'Kavi Nagar', 'Crossings Republik', 'Vasundhara'].map((a) => <option key={a} value={a}>{tr(a)}</option>))}</select></span></label>
            <button className="marketing-button" type="submit">{tr("Find a repair shop")}</button>
          </form>
        </div><div className="hero-reassurance"><span><ShieldCheck size={16} />{tr("Approved local shops")}</span><span><CircleCheck size={16} />{tr("Digital repair records")}</span></div>
      </div>
    </div><div className="marketing-wrap home-carousel-wrap"><RepairCarousel/></div></section>
    <section className="benefits-ribbon" aria-label={tr('Repair services')}><div className="marketing-wrap home-benefits">
      {[[Store,'Find a repair shop','Search by device and neighbourhood.'],[Wrench,'Track your repair','Follow updates from your workshop.'],[FileText,'Keep your service records','Your repair history and bills, together.']].map(([Icon,title,description])=><article className="home-benefit" key={title}><div className="home-benefit-icon"><Icon size={23}/></div><div><h3>{tr(title)}</h3><p>{tr(description)}</p></div></article>)}
    </div></section>
    <section className="marketing-wrap marketing-section"><div className="section-heading"><div><span className="eyebrow">{tr("Repair services")}</span><h2>{tr("What needs fixing?")}</h2></div><Link to="/find-shop" className="text-link">{tr("Explore all shops")}</Link></div>
      <div className="service-grid">{tr(devices.map((d, i) => <button key={d.name} onClick={() => findShops(d.category)} className={`service-tile ${d.color}`}><span className="service-icon"><d.icon size={46} strokeWidth={1.3} /></span><div><h3>{tr(d.name)}</h3><p>{tr(d.issue)}</p></div></button>))}</div>
    </section>
    <section className="how-section"><div className="marketing-wrap how-layout"><div><span className="eyebrow">{tr("How it works")}</span><h2>{tr("Repair booking")}</h2><p>{tr("Find a shop, book a service and follow repair updates.")}</p><Link to="/about" className="text-link">{tr("Get to know ServiceHub")}</Link></div><div className="how-steps">{tr([['Find a shop', 'Browse approved shops by device and neighbourhood.', Search], ['Book a repair', 'Book a repair and keep the job details together.', Wrench], ['Follow the work', 'Check progress, talk to your shop and find your invoice.', CircleCheck]].map(([title, text, Icon], i) => <div className="how-step" key={title}><span className="how-number">0{tr(i + 1)}</span><div><h3>{tr(title)}</h3><p>{tr(text)}</p></div><Icon size={22} /></div>))}</div></div><div className="marketing-wrap home-flow-wrap"><HomeRepairPreview/></div></section>
    <section className="marketing-wrap owner-section"><div className="owner-banner"><span className="owner-icon"><Store size={34} strokeWidth={1.4} /></span><div><span className="eyebrow">{tr("For repair shops")}</span><h2>{tr("Manage your workshop.")}</h2><p>{tr("Bring bookings, job cards and customer conversations together.")}</p></div><Link to="/register-shop" className="marketing-button light-button">{tr("List your repair shop")}</Link></div></section>
  </div>;
}
