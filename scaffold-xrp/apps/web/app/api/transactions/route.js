import { promises as fs } from "fs";
import { dataFilePath } from "../../../lib/dataPaths";

const TX_FILE = dataFilePath("transactions.json");
const ASSOCIATIONS_FILE = dataFilePath("associations.json");
const NFT_FILE = dataFilePath("nftActions.json");

export async function GET() {
  try {
    const raw = await fs.readFile(TX_FILE, "utf-8");
    return new Response(raw, { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to read transactions" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Expected body fields: associationId, amount (XRP), donorAddress, txHash (optional), nftId (optional)
    if (!body.associationId || !body.amount || !body.donorAddress) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const assocRaw = await fs.readFile(ASSOCIATIONS_FILE, "utf-8");
    const assocList = JSON.parse(assocRaw || "[]");
    const asso = assocList.find((a) => a.id === body.associationId);
    if (!asso) {
      return new Response(JSON.stringify({ error: "Association not found" }), { status: 404 });
    }

    // Validate amount does not exceed quota per donation or per NFT request
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
    }

    // Simple rule: donor cannot donate more than the association's levelQuota per donation
    if (amount > (asso.levelQuota || 0)) {
      return new Response(JSON.stringify({ error: `Amount exceeds maximum allowed per donation for this association (quota: ${asso.levelQuota} XRP)` }), { status: 400 });
    }

    // Persist transaction
    const rawTx = await fs.readFile(TX_FILE, "utf-8");
    const txList = JSON.parse(rawTx || "[]");

    const record = {
      id: `tx-${Date.now()}`,
      associationId: body.associationId,
      nftId: body.nftId || null,
      amount: amount,
      donorAddress: body.donorAddress,
      txHash: body.txHash || null,
      status: body.txHash ? "submitted" : "pending",
      createdAt: new Date().toISOString(),
    };

    txList.push(record);
    await fs.writeFile(TX_FILE, JSON.stringify(txList, null, 2), "utf-8");

    // If tied to an NFT, increment fundsReceived
    if (record.nftId) {
      try {
        const nftRaw = await fs.readFile(NFT_FILE, "utf-8");
        const nftList = JSON.parse(nftRaw || "[]");
        const nft = nftList.find((n) => n.id === record.nftId);
        if (nft) {
          nft.fundsReceived = (nft.fundsReceived || 0) + amount;
          await fs.writeFile(NFT_FILE, JSON.stringify(nftList, null, 2), "utf-8");
        }
      } catch (e) {
        // ignore NFT update errors but log
        console.error("Failed to update NFT funding:", e);
      }
    }

    return new Response(JSON.stringify(record), { status: 201, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
