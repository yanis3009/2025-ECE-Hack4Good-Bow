import { promises as fs } from "fs";
import { dataFilePath } from "../../../lib/dataPaths";

const NFT_FILE = dataFilePath("nftActions.json");
const ASSOCIATIONS_FILE = dataFilePath("associations.json");

// List or create nft action. Creating will trigger IA validation stub and
// update association level if validated.
export async function GET() {
  try {
    const raw = await fs.readFile(NFT_FILE, "utf-8");
    return new Response(raw, { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to read nft actions" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.associationId || !body.title || !body.imageUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const raw = await fs.readFile(NFT_FILE, "utf-8");
    const list = JSON.parse(raw || "[]");

    const newItem = {
      id: `nft-${Date.now()}`,
      associationId: body.associationId,
      title: body.title,
      description: body.description || "",
      imageUrl: body.imageUrl,
      requestedAmount: body.requestedAmount || 0,
      fundsReceived: 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    list.push(newItem);
    await fs.writeFile(NFT_FILE, JSON.stringify(list, null, 2), "utf-8");

    // Run IA validation locally (stub). This avoids making an HTTP call from
    // server runtimes and keeps the validation logic testable. TODO: replace
    // with a real ML/IA service.
    try {
      const validateIA = async ({ description, imageUrl }) => {
        const issues = [];
        if (!description || description.length < 10) issues.push("Description too short");
        if (!imageUrl || typeof imageUrl !== "string") issues.push("Missing image");
        const badWords = ["fraud", "spam", "scam"];
        const descLower = (description || "").toLowerCase();
        for (const w of badWords) if (descLower.includes(w)) issues.push(`Contains forbidden keyword: ${w}`);
        await new Promise((r) => setTimeout(r, 200));
        return { valid: issues.length === 0, issues };
      };

      const iaJson = await validateIA({ description: newItem.description, imageUrl: newItem.imageUrl });
      if (iaJson.valid) {
        newItem.status = "validated";
        const assocRaw = await fs.readFile(ASSOCIATIONS_FILE, "utf-8");
        const assocList = JSON.parse(assocRaw || "[]");
        const asso = assocList.find((a) => a.id === body.associationId);
        if (asso) {
          asso.level = (asso.level || 1) + 1;
          asso.levelQuota = Math.round((asso.levelQuota || 50) * 1.5 * 100) / 100;
          await fs.writeFile(ASSOCIATIONS_FILE, JSON.stringify(assocList, null, 2), "utf-8");
        }
      } else {
        newItem.status = "rejected";
        newItem.iaIssues = iaJson.issues || [];
      }

      const updatedRaw = await fs.readFile(NFT_FILE, "utf-8");
      const updatedList = JSON.parse(updatedRaw || "[]");
      const idx = updatedList.findIndex((n) => n.id === newItem.id);
      if (idx !== -1) {
        updatedList[idx] = newItem;
        await fs.writeFile(NFT_FILE, JSON.stringify(updatedList, null, 2), "utf-8");
      }
    } catch (iaErr) {
      console.error("IA validation internal error:", iaErr);
    }

    return new Response(JSON.stringify(newItem), { status: 201, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
