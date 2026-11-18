import {handleDialogCancel} from '../../utils/dialogEvents';
﻿import React,{useEffect,useRef} from 'react';
import AddMemberPage from './AddMemberPage';
export default function MemberFormOverlay({member,onClose,onSaved}){const ref=useRef(null);useEffect(()=>{const dialog=ref.current;if(!dialog?.open)dialog?.showModal();const overflow=document.body?.style.overflow;if(document.body)document.body.style.overflow='hidden';return()=>{dialog?.close?.();if(document.body)document.body.style.overflow=overflow||'';};},[]);return <dialog ref={ref} className="md-editor-dialog" aria-label={member?'Edit member details':'Add members'} onCancel={event=>handleDialogCancel(event,onClose)}><AddMemberPage embedded initialMember={member} onClose={onClose} onSaved={onSaved}/></dialog>}
