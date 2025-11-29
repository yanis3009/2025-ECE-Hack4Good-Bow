"use client";

export function AssociationNFTCard({ nft }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <img src={nft.imageUrl} alt={nft.title} className="w-full h-48 object-cover rounded-md mb-3" />
      <h4 className="font-semibold">{nft.title}</h4>
      <p className="text-sm text-gray-600">{nft.description}</p>
      <p className="text-sm text-gray-700 mt-2">Montant demandé: {nft.requestedAmount} XRP</p>
      <p className="text-sm text-gray-600">Récolté: {nft.fundsReceived} XRP</p>
      <p className="text-xs text-gray-500">Statut: {nft.status}</p>
    </div>
  );
}
