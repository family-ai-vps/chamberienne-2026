/* Pointage TEST — adaptateur isolé, non branché à la DEMO.
 * Aucune fonction Apps Script ni authentification n'est supposée.
 * Injection explicite d'un transport confirmé uniquement après audit serveur.
 */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChamberiennePointage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const MODES = Object.freeze({ DEMO: 'demo', TEST: 'test' });
  class PointageError extends Error {
    constructor(code, message) { super(message || code); this.name='PointageError'; this.code=code; }
  }
  function requireVersion(value) {
    if (!Number.isSafeInteger(value) || value < 0) throw new PointageError('INVALID_VERSION');
    return value;
  }
  function requireSnapshot(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PointageError('INVALID_RESPONSE');
    requireVersion(value.version);
    if (!Array.isArray(value.pointages)) throw new PointageError('INVALID_RESPONSE');
    return value;
  }
  function createTestAdapter(transport) {
    if (!transport || !['load','write','refresh'].every(k => typeof transport[k] === 'function'))
      throw new PointageError('TRANSPORT_NOT_CONFIGURED');
    const pending = new Set();
    const uncertain = new Set();
    let snapshot = null;
    let activeScope = null;
    function scopeKey(sector) {
      if (typeof sector !== 'string' || !sector.trim()) throw new PointageError('INVALID_SECTOR');
      return sector;
    }
    async function load(context) {
      const sector = scopeKey(context && context.sector);
      const result = requireSnapshot(await transport.load(context));
      snapshot = result; activeScope = sector; uncertain.clear();
      return result;
    }
    async function refresh(context) {
      const sector = scopeKey(context && context.sector);
      const result = requireSnapshot(await transport.refresh(context));
      snapshot = result; activeScope = sector; uncertain.clear();
      return result;
    }
    async function write(context) {
      if (!context || typeof context.affectationId !== 'string' || !context.affectationId.trim())
        throw new PointageError('INVALID_ASSIGNMENT');
      if (!['PRESENT','ANNULER'].includes(context.action)) throw new PointageError('INVALID_ACTION');
      const sector = scopeKey(context.sector);
      if (!snapshot || activeScope !== sector) throw new PointageError('REFRESH_REQUIRED');
      if (uncertain.size) throw new PointageError('RECONCILIATION_REQUIRED');
      const key = context.affectationId;
      if (pending.has(key)) throw new PointageError('OPERATION_PENDING');
      pending.add(key);
      try {
        const reply = await transport.write({ ...context, versionAttendue: requireVersion(snapshot.version) });
        if (!reply || !Number.isSafeInteger(reply.version) || reply.version <= snapshot.version ||
            reply.affectationId !== key || !Object.prototype.hasOwnProperty.call(reply,'etat'))
          throw new PointageError('UNVERIFIED_RESPONSE');
        // Ne pas exposer un nouvel état sans relecture serveur : l'accusé seul
        // ne contient pas nécessairement la liste complète des affectations.
        uncertain.add(key);
        return { status:'reconciliation_required', version:reply.version, affectationId:key };
      } catch(error) {
        // Refus explicite de version/autorisation : relecture requise.
        // Erreur réseau ou timeout : écriture potentiellement effectuée.
        uncertain.add(key);
        throw error;
      } finally { pending.delete(key); }
    }
    return Object.freeze({
      mode:MODES.TEST, load, refresh, write,
      getSnapshot:() => snapshot,
      needsReconciliation:() => uncertain.size > 0,
      isPending:id => pending.has(id)
    });
  }
  function createDemoAdapter(legacy) {
    if (!legacy || typeof legacy.read !== 'function' || typeof legacy.write !== 'function')
      throw new PointageError('DEMO_NOT_CONFIGURED');
    return Object.freeze({ mode:MODES.DEMO, read:(...args)=>legacy.read(...args),
      write:(...args)=>legacy.write(...args) });
  }
  return Object.freeze({MODES, PointageError, createDemoAdapter, createTestAdapter});
});
