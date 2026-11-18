import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

export default function PageReveal() {
  const {pathname}=useLocation();
  useEffect(()=>{
    if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nodes=document.querySelectorAll('.marketing-section,.how-layout,.owner-banner');
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}});
    },{threshold:0.08});
    nodes.forEach(node=>{node.classList.add('reveal-section');observer.observe(node);});
    return ()=>{observer.disconnect();nodes.forEach(node=>node.classList.remove('reveal-section','is-revealed'));};
  },[pathname]);
  return null;
}
