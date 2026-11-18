import {handleDialogCancel} from '../../utils/dialogEvents';
import '../../styles/service-catalogue.css';
import React,{useState} from 'react';
import {X} from 'lucide-react';
import '../../styles/business-workspace.css';
export function BusinessDialog({title,onClose,children,className=''}){const ref=React.useRef(null);React.useEffect(()=>{ref.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[]);return <dialog ref={ref} className={'biz-dialog '+className} onCancel={event=>handleDialogCancel(event,onClose)} aria-label={title}><header><h2>{title}</h2><button type="button" aria-label="Close" onClick={onClose}><X size={22}/></button></header>{children}</dialog>;}
export function BusinessField({label,error,children}){const id=React.useId(),decorate=nodes=>React.Children.map(nodes,child=>{if(!React.isValidElement(child))return child;if(['input','select','textarea'].includes(child.type))return React.cloneElement(child,{'aria-invalid':!!error,'aria-describedby':error?id:undefined});if(child.type===React.Fragment)return React.cloneElement(child,{},decorate(child.props.children));return child;});return <label className="biz-field"><span>{label}</span>{decorate(children)}{error&&<small id={id} role="alert">{error}</small>}</label>;}

export {default} from './LabourServiceWorkspace';
