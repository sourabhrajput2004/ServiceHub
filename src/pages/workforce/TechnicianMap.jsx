import React, { useState } from 'react';
import {MapPin, Navigation, Map} from 'lucide-react';
import { techColors, realPoint, clock, timestamp } from './technicianManagementData';
// Web Mercator tiles and markers use only timestamped coordinates supplied by the app.
const zoom = 13,
  tileSize = 256,
  scale = tileSize * 2 ** zoom;
function project(point) {
  const sin = Math.sin(point.lat * Math.PI / 180);
  return {
    x: (point.lng + 180) / 360 * scale,
    y: (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  };
}
export default function TechnicianMap({
  rows,
  shop,
  selected,
  onSelect,
  refreshCount
}) {
  const [failed, setFailed] = useState(false);
  const points = rows.filter(r => r.point && r.state !== 'Off');
  const shopPoint = !['shop_1', 'shop_2'].includes(shop?.id) || shop?.coordinatesSource === 'gps'?  realPoint(shop?.coordinates) : null;
  const chosen = points.find(r => r.member.id === selected) || points[0];
  const center = chosen?.point || shopPoint;
  const projected = center?  project(center) : null;
  const width = 600,
    height = 600,
    origin = projected?  {
      x: projected.x - width / 2,
      y: projected.y - height / 2
    } : null;
  const tiles = [];
  if (origin) for (let x = Math.floor(origin.x / tileSize); x <= Math.floor((origin.x + width) / tileSize); x++) for (let y = Math.floor(origin.y / tileSize); y <= Math.floor((origin.y + height) / tileSize); y++) {
    if (y >= 0 && y < 2 ** zoom) tiles.push({
      x,
      y,
      left: x * tileSize - origin.x,
      top: y * tileSize - origin.y
    });
  }
  const pin = (point, id, color, label) => {
    const p = project(point),
      x = (p.x - origin.x) / width * 100,
      y = (p.y - origin.y) / height * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return <button key={id} type="button" className={'tm-map-pin ' + (id === selected ? 'selected' : '')} style={{
      left: x + '%',
      top: y + '%',
      background: color
    }} aria-label={label} title={label} onClick={() => onSelect(id)}><MapPin size={17} /></button>;
  };
  return <section className="tm-map-panel"><header><div><h2>Live location map</h2><p>Reported locations · refresh every 60s</p></div><span className="tm-map-live"><span />GPS</span></header><details className="tm-map-collapse" open><summary>Show / hide map</summary><div className="tm-map-surface">{!center ? <div className="tm-map-empty"><span><Map size={34} /></span><h3>No location updates yet</h3><p>Technician pins appear when GPS coordinates are available.</p></div> : <><div className="tm-map-tiles" aria-hidden="true">{tiles.map(t => <img key={t.x + ':' + t.y + ':' + refreshCount} src={'https://tile.openstreetmap.org/' + zoom + '/' + (t.x % 2 ** zoom + 2 ** zoom) % 2 ** zoom + '/' + t.y + '.png'} alt="" onError={() => setFailed(true)} style={{
              left: t.left / width * 100 + '%',
              top: t.top / height * 100 + '%',
              width: tileSize / width * 100 + '%',
              height: tileSize / height * 100 + '%'
            }} />)}</div>{chosen?.current?.destinationCoordinates && realPoint(chosen.current.destinationCoordinates) && chosen.state === 'On Visit (Home)' && <svg className="tm-map-route" viewBox="0 0 600 600" aria-label="Destination direction preview"><line x1={project(chosen.point).x - origin.x} y1={project(chosen.point).y - origin.y} x2={project(realPoint(chosen.current.destinationCoordinates)).x - origin.x} y2={project(realPoint(chosen.current.destinationCoordinates)).y - origin.y} stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 7" /></svg>}{shopPoint && pin(shopPoint, 'shop', '#2563eb', 'Shop location')}{points.map(r => pin(r.point, r.member.id, r.offline ? '#6B7280' : techColors[r.state], r.member.name + ' · ' + r.state))}<a className="tm-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>{failed && <span className="tm-map-error">Map tiles unavailable. GPS markers still show reported coordinates.</span>}</>}</div></details>{chosen && <div className="tm-map-popup"><strong>{chosen.member.name}</strong><span>{chosen.state} · {chosen.current?.issueType || 'No current job'}</span><small>GPS updated: {clock(chosen.reportedAt)}</small>{chosen.current?.etaMinutes != null && <small>Reported ETA: {chosen.current.etaMinutes} min</small>}<a target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query=' + chosen.point.lat + ',' + chosen.point.lng}><Navigation size={15} />Open in Google Maps</a></div>}<div className="tm-map-legend">{Object.entries({
        ...techColors,
        Offline: '#6B7280'
      }).map(([state, color]) => <span key={state}><i style={{
          background: color
        }} />{state}</span>)}</div>{points.length > 1 && <div className="tm-map-people">{points.map(r => <button key={r.member.id} aria-pressed={selected === r.member.id} onClick={() => onSelect(r.member.id)}>{r.member.name}</button>)}</div>}<footer>{chosen ? 'Last GPS update: ' + clock(chosen.reportedAt) : 'Waiting for reported GPS data.'}<p>Destination lines show direction only, not a driving route.</p></footer></section>;
}
