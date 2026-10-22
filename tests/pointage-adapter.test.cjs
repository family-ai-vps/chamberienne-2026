const test = require('node:test');
const assert = require('node:assert/strict');
const {createDemoAdapter,createTestAdapter,PointageError} = require('../pointage/adapter.js');
const sample = version => ({version,pointages:[],missions:[]});
test('DEMO délègue sans accès serveur', () => {
  let count=0; const demo=createDemoAdapter({read:()=>42,write:()=>++count});
  assert.equal(demo.mode,'demo');assert.equal(demo.read(),42);assert.equal(demo.write(),1);
});
test('TEST est bloqué sans transport réel',()=>assert.throws(()=>createTestAdapter(), /TRANSPORT_NOT_CONFIGURED/));
test('TEST ne peut écrire avant chargement et version', async()=>{
  const adapter=createTestAdapter({load:async()=>sample(3),refresh:async()=>sample(3),write:async()=>({version:4,affectationId:'A1',etat:'présent'})});
  await assert.rejects(adapter.write({sector:'S',affectationId:'A1',action:'PRESENT'}),{code:'REFRESH_REQUIRED'});
  await adapter.load({sector:'S'});assert.equal(adapter.getSnapshot().version,3);
  assert.equal((await adapter.write({sector:'S',affectationId:'A1',action:'PRESENT'})).status,'reconciliation_required');
  assert.equal(adapter.getSnapshot().version,3);assert.equal(adapter.needsReconciliation(),true);
  await assert.rejects(adapter.write({sector:'S',affectationId:'A1',action:'PRESENT'}),{code:'RECONCILIATION_REQUIRED'});
  await adapter.refresh({sector:'S'});assert.equal(adapter.needsReconciliation(),false);
});
test('double clic : une seule écriture',async()=>{
  let release;const gate=new Promise(r=>release=r);let calls=0;
  const a=createTestAdapter({load:async()=>sample(0),refresh:async()=>sample(1),write:async()=>{calls++;await gate;return {version:1,affectationId:'A1',etat:'présent'}}});
  await a.load({sector:'S'});
  const first=a.write({sector:'S',affectationId:'A1',action:'PRESENT'});
  await assert.rejects(a.write({sector:'S',affectationId:'A1',action:'PRESENT'}),{code:'OPERATION_PENDING'});
  release();await first;assert.equal(calls,1);
});
test('timeout ne signifie jamais succès',async()=>{
  const a=createTestAdapter({load:async()=>sample(1),refresh:async()=>sample(2),write:async()=>{throw Error('timeout')}});
  await a.load({sector:'S'});
  await assert.rejects(a.write({sector:'S',affectationId:'A1',action:'PRESENT'}),/timeout/);
  assert.equal(a.getSnapshot().version,1);assert.equal(a.needsReconciliation(),true);
  await a.refresh({sector:'S'});assert.equal(a.getSnapshot().version,2);
});
test('réponse invalide ne valide pas le pointage',async()=>{
 const a=createTestAdapter({load:async()=>sample(1),refresh:async()=>sample(1),write:async()=>({version:1,affectationId:'A1',etat:'présent'})});
 await a.load({sector:'S'});
 await assert.rejects(a.write({sector:'S',affectationId:'A1',action:'ANNULER'}),{code:'UNVERIFIED_RESPONSE'});
 assert.equal(a.needsReconciliation(),true);
});
