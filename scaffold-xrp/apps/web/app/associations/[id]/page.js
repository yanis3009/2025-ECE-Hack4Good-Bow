import AssociationDetail from "../../../components/AssociationDetail";
import { Header } from "../../../components/Header";

export default function AssociationPage({ params }) {
  const { id } = params;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AssociationDetail associationId={id} />
      </main>
    </div>
  );
}
