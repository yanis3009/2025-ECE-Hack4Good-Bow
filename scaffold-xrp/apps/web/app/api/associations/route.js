import { promises as fs } from "fs";
import { dataFilePath } from "../../../lib/dataPaths";

const ASSOCIATIONS_FILE = dataFilePath("associations.json");

// Simple GET/POST handler for associations. This is a small persistence stub
// using JSON files. TODO: replace with real DB (Postgres/SQLite/etc.).
export async function GET() {
  try {
    const raw = await fs.readFile(ASSOCIATIONS_FILE, "utf-8");
    return new Response(raw, { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to read associations" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const raw = await fs.readFile(ASSOCIATIONS_FILE, "utf-8");
    const list = JSON.parse(raw || "[]");

    // Basic validation
    if (!body.name || !body.ownerAddress) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const newItem = {
      id: `asso-${Date.now()}`,
      name: body.name,
      city: body.city || "",
      country: body.country || "",
      level: 1,
      levelQuota: body.levelQuota || 50.0,
      ownerAddress: body.ownerAddress,
      description: body.description || "",
      validated: false,
    };

    list.push(newItem);
    await fs.writeFile(ASSOCIATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");

    return new Response(JSON.stringify(newItem), { status: 201, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
