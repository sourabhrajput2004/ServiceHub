import {useAuth} from '../../context/AuthContext';
﻿import React from 'react';
import {invoiceMarkup,invoicePrintCSS} from '../../utils/invoiceDocument';
export default function InvoiceDocument({invoice,shop,audience}){const {user}=useAuth()||{};const view=audience||(['shop_owner','staff'].includes(user?.role)?'internal':'customer');return <><style>{invoicePrintCSS}</style><div dangerouslySetInnerHTML={{__html:invoiceMarkup(invoice,shop,{audience:view})}}/></>;}
