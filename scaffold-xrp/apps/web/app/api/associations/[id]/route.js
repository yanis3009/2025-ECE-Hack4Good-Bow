import { promises as fs } from "fs";
import { dataFilePath } from "../../../../lib/dataPaths";

const ASSOCIATIONS_FILE = dataFilePath("associations.json");
const NFT_FILE = dataFilePath("nftActions.json");

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const raw = await fs.readFile(ASSOCIATIONS_FILE, "utf-8");
    const list = JSON.parse(raw || "[]");
    const asso = list.find((a) => a.id === id);
    if (!asso) {
      return new Response(JSON.stringify({ error: "Association not found" }), { status: 404 });
    }

    // Load NFT actions for this association
    let nftraw = await fs.readFile(NFT_FILE, "utf-8");
    const nfts = JSON.parse(nftraw || "[]").filter((n) => n.associationId === id);

    const payload = { ...asso, nftActions: nfts };
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
