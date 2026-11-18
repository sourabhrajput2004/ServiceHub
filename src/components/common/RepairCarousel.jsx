import React, {useEffect, useRef, useState} from 'react';

import {Link} from 'react-router-dom';
import {useLanguage} from '../../context/LanguageContext';

const slides = [
  {image:'/images/repair-workshop.jpg', title:'Phone & tablet repairs', label:'Screens, batteries and charging', category:'Mobile Phones', alt:'Technician working at an electronics repair bench'},
  {image:'/images/laptop-care.jpg', title:'Laptop & computer repairs', label:'Diagnostics, upgrades and maintenance', category:'Laptops & Computers', alt:'Laptop on a desk'},
  {image:'/images/repair-technician.jpg', title:'Appliance repairs', label:'Find service near you', category:'Home Appliances', alt:'Specialist working with electronic equipment'},
];

export default function RepairCarousel() {
  const {tr}=useLanguage();
  const track=useRef(null), drag=useRef(null);
  const [active,setActive]=useState(0);
  const go=index=>track.current?.scrollTo({left:index*track.current.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer=window.setInterval(()=>{
      const element=track.current;
      const carousel=element?.parentElement;
      if(!element?.clientWidth||document.hidden||motion.matches||drag.current||carousel?.matches(':hover')||carousel?.contains(document.activeElement))return;
      const current=Math.round(element.scrollLeft/element.clientWidth);
      element.scrollTo({left:((current+1)%slides.length)*element.clientWidth,behavior:'smooth'});
    },5000);
    return ()=>window.clearInterval(timer);
  },[]);

  return <div className="repair-carousel" aria-label={tr('Repair services')} aria-roledescription="carousel">
    <div className="repair-carousel-track" ref={track} tabIndex={0}
      onScroll={()=>{const element=track.current;if(element?.clientWidth)setActive(Math.round(element.scrollLeft/element.clientWidth));}}
      onPointerDown={event=>{if(event.pointerType==='mouse')drag.current={x:event.clientX,left:track.current.scrollLeft};}}
      onPointerMove={event=>{if(drag.current&&event.buttons===1)track.current.scrollLeft=drag.current.left+drag.current.x-event.clientX;}}
      onPointerUp={()=>{drag.current=null;}} onPointerLeave={()=>{drag.current=null;}}
      onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(Math.max(0,Math.min(slides.length-1,active+(event.key==='ArrowRight'?1:-1))));}}}>
      {slides.map((slide,index)=><article className="repair-carousel-slide" key={slide.image} aria-label={`${index+1} / ${slides.length}`}>
        <img src={slide.image} alt={tr(slide.alt)} loading={index===0?'eager':'lazy'} draggable="false"/>
        <div className="repair-carousel-copy"><span>{tr(slide.label)}</span><h2>{tr(slide.title)}</h2><Link draggable="false" to={'/find-shop?'+new URLSearchParams({category:slide.category})}>{tr('Find a repair shop')}</Link></div>
      </article>)}
    </div>
    <div className="repair-carousel-pagination">{slides.map((slide,index)=><button key={slide.image} type="button" aria-label={tr('Show slide')+' '+(index+1)} aria-current={active===index?'true':undefined} onClick={()=>go(index)}/>)}</div>
  </div>;
}
