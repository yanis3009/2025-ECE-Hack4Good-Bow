"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AssociationsList() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/associations');
        const json = await res.json();
        // Defensive: ensure we always store an array to avoid mapping non-arrays
        if (Array.isArray(json)) {
          setList(json);
        } else if (json && json.error) {
          setError(json.error);
          setList([]);
        } else if (json && typeof json === 'object') {
          // If API returns an object with a 'data' array
          if (Array.isArray(json.data)) {
            setList(json.data);
          } else {
            setError('Unexpected response format from /api/associations');
            setList([]);
          }
        } else {
          setList([]);
        }
      } catch (e) {
        console.error('Failed to load associations', e);
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Chargement des associations…</div>;

  return (
    <div className="space-y-4">
      {list.length === 0 && <div>Aucune association disponible pour le moment.</div>}
      {list.map((a) => (
        <div key={a.id} className="p-4 border rounded-lg bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{a.name}</h3>
              <p className="text-sm text-gray-600">{a.city}, {a.country}</p>
              <p className="text-sm text-gray-600">Niveau: {a.level} — Quota: {a.levelQuota} XRP</p>
            </div>
            <div>
              <Link href={`/associations/${a.id}`} className="text-accent font-medium">Voir</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
