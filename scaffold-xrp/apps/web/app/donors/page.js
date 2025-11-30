"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/components/providers/WalletProvider";

export default function DonorsPage() {
  const { walletAddress } = useWallet();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/associations");
      if (!response.ok) throw new Error("Failed to fetch donors");
      const data = await response.json();
      setDonors(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching donors:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Espace Donateur</h1>
              <p className="text-gray-600">Découvrez les organisations et soutenez leurs missions</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour
            </Link>
          </div>

          {walletAddress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700">
                <strong>Wallet connecté:</strong> {walletAddress.slice(0, 10)}...{walletAddress.slice(-10)}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Erreur: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des organisations...</p>
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune organisation trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor) => (
              <div
                key={donor.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">{donor.name}</h2>
                <p className="text-gray-600 mb-4">{donor.description}</p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Catégorie:</strong> {donor.category || "Non spécifiée"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Contact:</strong> {donor.contact || "Non disponible"}
                  </p>
                </div>
                <Link
                  href={`/associations/${donor.id}`}
                  className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voir les détails
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
