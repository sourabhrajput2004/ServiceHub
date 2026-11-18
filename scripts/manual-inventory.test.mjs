import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const {partErrors,normalizePartDetails,partKey,savedPartValues,filterParts}=await server.ssrLoadModule('/src/utils/partsInventory.js');
 const {familyErrors,familyKey,blankVariant}=await server.ssrLoadModule('/src/utils/inventoryVariants.js');
 const {SHOP_TYPES}=await server.ssrLoadModule('/src/utils/shopInventoryTypes.js');
 for(const type of SHOP_TYPES){
  const shop={id:'manual-shop',shopTypes:[type.id]},part=normalizePartDetails({shopId:shop.id,inventoryDomain:type.id,brand:'  Custom   Brand ',model:'New Model 2026',partType:'Swing Motor Assembly',name:'New Model 2026 Swing Motor Assembly',variant:'Normal',costPrice:10,sellingPrice:20,stockQty:5,minThreshold:2,restockQty:5});
  assert.deepEqual(partErrors(part,shop),{},type.id+' accepts manual names');
  assert.equal(part.brand,'Custom Brand');
  const equivalent={...part,brand:'custom brand',model:' new   model 2026 ',partType:'swing motor assembly'};
  assert.equal(partKey(part),partKey(equivalent));assert.equal(familyKey(part,shop),familyKey(equivalent,shop));
  const rows=[part,{...equivalent,id:'second'}, {...part,shopId:'other',brand:'Hidden Brand'}];
  assert.deepEqual(savedPartValues(rows,shop.id,'brand'),['Custom Brand']);
  assert.deepEqual(savedPartValues(rows,shop.id,'partType'),['Swing Motor Assembly']);
  assert.equal(filterParts(rows,{brand:'CUSTOM BRAND',type:'swing motor assembly'}).length,2);
  const universal=normalizePartDetails({...part,brand:' universal ',model:'Ignored',name:'Generic cleaner'});assert.equal(universal.brand,'Universal');assert.equal(universal.model,'');assert.deepEqual(partErrors(universal,shop),{});
  assert.ok(familyErrors({...universal,name:''},[{...blankVariant(),costPrice:10,sellingPrice:20}],shop).fields.name);
  assert.ok(partErrors({...part,brand:''},shop).brand);assert.ok(partErrors({...part,model:''},shop).model);assert.ok(partErrors({...part,partType:''},shop).partType);
 }
 console.log('Passed manual inventory names for all shop types, validation, normalized duplicate keys, saved inventory filters and Universal parts.');
}finally{await server.close();}

