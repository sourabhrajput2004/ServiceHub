import {useWorkforce} from '../../context/WorkforceContext';
import {workerHome,workerScreens} from '../../utils/workforceAccess';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user,logout } = useAuth();
  const workforce=useWorkforce();
  const location = useLocation();

  if (!user) {
    // Redirect to login while saving the attempted location
    return <Navigate to={location.pathname.startsWith('/technician/')||location.pathname.startsWith('/staff/')?'/member-login':'/login'} state={{ from: location, message: 'Please sign in to access this page.' }} replace />;
  }

  if(['technician','staff'].includes(user.role)){
    const member=workforce?.member,allowed=workforce?.allowed&&workerScreens(member).length>0;
    if(!allowed)return <div className="wf-page"><h1>Access unavailable</h1><p>This member does not have an active dashboard. Contact the shop owner.</p><button onClick={logout}>Sign out</button></div>;
    const paths=workerScreens(member).map(screen=>'/'+member.role+'/'+screen);
    if(location.pathname==='/staff/billing'&&workerScreens(member).includes('orders'))return <Navigate to="/staff/orders?tab=billing" replace/>;
    const billScreen=location.pathname==='/staff/orders/bill/new'&&member.role==='staff'&&workerScreens(member).includes('orders');
    if(!paths.includes(location.pathname)&&!billScreen)return <Navigate to={workerHome(member)} replace/>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not authorized, redirect to their default home
    return <Navigate to="/" replace />;
  }

  return children;
}

