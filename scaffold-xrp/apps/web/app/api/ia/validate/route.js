// Simple IA validation stub. In production, replace with calls to a real ML
// service. The interface expects a JSON body: { association, description, imageUrl }
export async function POST(request) {
  try {
    const body = await request.json();

    // Very simple heuristics as a placeholder:
    const issues = [];

    if (!body.description || body.description.length < 10) {
      issues.push("Description too short");
    }

    if (!body.imageUrl || typeof body.imageUrl !== "string") {
      issues.push("Missing image");
    }

    // Simple keyword check: if description contains 'fraud' or 'spam' fail
    const badWords = ["fraud", "spam", "scam"];
    const descLower = (body.description || "").toLowerCase();
    for (const w of badWords) {
      if (descLower.includes(w)) issues.push(`Contains forbidden keyword: ${w}`);
    }

    const valid = issues.length === 0;

    // Simulate slight processing delay
    await new Promise((r) => setTimeout(r, 250));

    return new Response(JSON.stringify({ valid, issues }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: err.message }), { status: 500 });
  }
}
