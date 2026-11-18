export function homeServiceRate(shop){
 const value=shop?.homeServiceRatePerKm;
 if(value===null)return null;
 return value===undefined?10:Number(value);
}
export const validHomeServiceRate=value=>value!==''&&value!==null&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1000000;
export function homeServiceTotal(distanceKm,rate){
 if(distanceKm===''||!Number.isFinite(Number(distanceKm))||Number(distanceKm)<0||rate===null||!validHomeServiceRate(rate))return null;
 return Math.round(Number(distanceKm)*Number(rate)*100)/100;
}
