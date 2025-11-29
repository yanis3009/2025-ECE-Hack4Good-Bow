import { Header } from "../../components/Header";
import { AssociationsList } from "../../components/AssociationsList";

export default function AssociationsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Micro‑associations</h1>
        <AssociationsList />
      </main>
    </div>
  );
}
