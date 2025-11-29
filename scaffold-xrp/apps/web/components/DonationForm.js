"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";

// DonationForm handles donor input, client-side XRPL signing via walletManager,
// and persists the transaction by calling the server API. It validates amount
// against the provided associationQuota prop and uses receivingAddress as the
// transaction destination on the XRPL.
export function DonationForm({ associationId, associationQuota, receivingAddress, nftId = null }) {
  const { walletManager, isConnected, accountInfo, showStatus, addEvent } = useWallet();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !walletManager || !accountInfo) {
      showStatus("Veuillez connecter votre portefeuille", "error");
      return;
    }

    const numeric = Number(amount);
    if (isNaN(numeric) || numeric <= 0) {
      showStatus("Montant invalide", "error");
      return;
    }

    if (associationQuota && numeric > Number(associationQuota)) {
      showStatus(`Montant dépasse le quota (${associationQuota} XRP)`, "error");
      return;
    }

    // Build a simple Payment transaction. Amount must be in drops for the signAndSubmit helper
    // existing in walletManager; here we attempt to reuse similar logic as TransactionForm.
    try {
      setIsLoading(true);
      setResult(null);

      // Use the association's receivingAddress as the transaction destination
      const destination = receivingAddress || walletManager.account.address;

      const transaction = {
        TransactionType: "Payment",
        Account: walletManager.account.address,
        Destination: destination,
        Amount: String(Math.round(numeric * 1000000)), // convert XRP -> drops
      };

      // Sign and submit using walletManager if available
      let txResult = null;
      if (typeof walletManager.signAndSubmit === "function") {
        txResult = await walletManager.signAndSubmit(transaction);
        addEvent("Donation Signed & Submitted", txResult);
        showStatus("Transaction signée et soumise", "success");
      } else {
        // WalletManager doesn't support signAndSubmit in this environment — simulate
        txResult = { hash: null, id: null };
      }

      // Persist transaction on backend
      try {
        const persist = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            associationId,
            nftId,
            amount: numeric,
            donorAddress: accountInfo.address,
            txHash: txResult?.hash || null,
          }),
        });

        const persistJson = await persist.json();
        setResult({ success: true, persist: persistJson, txResult });
      } catch (persistErr) {
        setResult({ success: false, error: persistErr.message });
        showStatus(`Erreur serveur: ${persistErr.message}`, "error");
      }

      setAmount("");
    } catch (err) {
      setResult({ success: false, error: err.message });
      showStatus(`Erreur lors de la transaction: ${err.message}`, "error");
      addEvent("Donation Error", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="card">
      <h3 className="font-bold mb-2">Faire un don</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Montant (XRP)</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          {associationQuota && (
            <p className="text-xs text-gray-500">Maximum autorisé: {associationQuota} XRP</p>
          )}
        </div>
        <button type="submit" className="bg-accent text-white px-3 py-2 rounded-md" disabled={isLoading}>
          {isLoading ? 'En cours…' : 'Doner en XRP'}
        </button>
      </form>

      {result && (
        <div className={`mt-3 p-3 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? (
            <div>
              <p className="text-sm text-green-800">Donation enregistrée.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-red-800">Erreur: {result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
