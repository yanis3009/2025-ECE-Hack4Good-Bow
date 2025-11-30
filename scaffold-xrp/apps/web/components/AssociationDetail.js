"use client";

import { useEffect, useState } from "react";
import { AssociationNFTCard } from "./AssociationNFTCard";
import { DonationForm } from "./DonationForm";
import { useWallet } from "./providers/WalletProvider";
import Link from "next/link";

/**
 * AssociationDetail displays an association as an NFT with metadata:
 * - Association name, location, level
 * - Total score (calculated from validated NFT actions × 50 points each)
 * - List of NFT Actions (metadata for each action)
 * - Donation form for donors
 * - (TODO: NFT creation form for association owner)
 */
export default function AssociationDetail({ associationId }) {
  const [association, setAssociation] = useState(null);
  const [nftActions, setNftActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accountInfo } = useWallet();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/associations/${associationId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        
        // data contains association + nftActions array
        setAssociation(data);
        setNftActions(data.nftActions || []);
      } catch (e) {
        console.error("Failed to load association detail:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [associationId]);

  if (loading) return <div>Chargement…</div>;
  if (error) return <div className="text-red-600">Erreur: {error}</div>;
  if (!association) return <div>Association non trouvée</div>;

  const isOwner = accountInfo && accountInfo.address === association.ownerAddress;

  // Calculate score: 50 points per validated action
  const validatedActions = nftActions.filter((n) => n.status === "validated");
  const totalScore = validatedActions.length * 50;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link href="/associations" className="text-accent font-medium">
          ← Retour à la liste
        </Link>
      </div>

      {/* Association NFT Metadata Card */}
      <div className="p-6 border-2 border-purple-300 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <h1 className="text-3xl font-bold mb-2">{association.name}</h1>
        <p className="text-gray-600 mb-4">
          {association.city}, {association.country}
        </p>
        <p className="text-gray-700 mb-4">{association.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">Niveau</p>
            <p className="text-2xl font-bold text-accent">{association.level}</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">Quota XRP</p>
            <p className="text-2xl font-bold text-accent">{association.levelQuota}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border-4 border-green-400">
            <p className="text-xs text-gray-500 font-bold">Total Donné</p>
            <p className="text-3xl font-bold text-green-600">
              {association.totalFundsReceived || 0}
            </p>
            <p className="text-xs text-gray-500">XRP</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">Actions validées</p>
            <p className="text-2xl font-bold text-green-600">{validatedActions.length}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border-4 border-yellow-400">
            <p className="text-xs text-gray-500 font-bold">SCORE NFT</p>
            <p className="text-3xl font-bold text-yellow-600">{totalScore}</p>
            <p className="text-xs text-gray-500">pts</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">État</p>
            <p className={`text-sm font-bold ${association.validated ? 'text-green-600' : 'text-yellow-600'}`}>
              {association.validated ? '✓ Validée' : '⏳ En attente'}
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1 border-t pt-3">
          <p>
            <strong>Adresse propriétaire:</strong> <code className="text-xs bg-gray-100 px-1">{association.ownerAddress}</code>
          </p>
          <p>
            <strong>Adresse de réception:</strong> <code className="text-xs bg-gray-100 px-1">{association.receivingAddress}</code>
          </p>
        </div>
      </div>

      {/* NFT Actions Metadata List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Actions menées ({validatedActions.length} validées)
        </h2>
        {validatedActions.length === 0 ? (
          <p className="text-gray-500">Aucune action validée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validatedActions.map((nft) => (
              <AssociationNFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )}
      </div>

      {/* All NFT Actions (including pending/rejected for transparency) */}
      {nftActions.length > validatedActions.length && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Autres actions ({nftActions.length - validatedActions.length} en attente/rejetée)
          </h3>
          <div className="space-y-2">
            {nftActions.filter((n) => n.status !== "validated").map((nft) => (
              <div
                key={nft.id}
                className={`p-3 border rounded text-sm ${
                  nft.status === "rejected"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <strong>{nft.title}</strong> — Statut: <span className="font-semibold">{nft.status}</span>
                {nft.iaIssues && nft.iaIssues.length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    Raisons: {nft.iaIssues.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donation Form */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Soutenir cette association</h2>
        <DonationForm
          associationId={associationId}
          associationQuota={association.levelQuota}
          receivingAddress={association.receivingAddress}
        />
      </div>

      {isOwner && (
        <div className="p-4 bg-white border rounded">
          <h3 className="font-semibold">Espace association — créer une NFT Action</h3>
          <CreateNFTForm associationId={association.id} />
        </div>
      )}
    </div>
  );
}

function CreateNFTForm({ associationId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [requestedAmount, setRequestedAmount] = useState(0);
  const [status, setStatus] = useState(null);

  // For demo: simple image upload via URL input. TODO: implement camera/file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch('/api/nft-actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ associationId, title, description, imageUrl, requestedAmount }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({ success: true, data: json });
      } else {
        setStatus({ success: false, error: json.error || 'Erreur' });
      }
    } catch (err) {
      setStatus({ success: false, error: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <div>
        <label className="block text-sm">Titre</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-sm">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-2 py-1" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Image URL (temporarily)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block text-sm">Montant demandé (XRP)</label>
        <input type="number" step="0.01" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <button className="bg-accent text-white px-3 py-1 rounded">Créer l'action</button>

      {status && (
        <div className={`mt-3 p-3 rounded ${status.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {status.success ? <div>Création enregistrée (statut: {status.data.status})</div> : <div>Erreur: {status.error}</div>}
        </div>
      )}
    </form>
  );
}
