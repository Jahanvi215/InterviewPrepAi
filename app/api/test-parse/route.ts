import { NextResponse } from "next/server";

export async function GET() {
  const steps: Record<string, string> = {};
  try {
    // Step 1: Can we import unpdf?
    steps.step1 = "importing unpdf...";
    const { extractText } = await import("unpdf");
    steps.step1 = "ok";

    // Step 2: Can we call extractText with dummy data?
    steps.step2 = "calling extractText...";
    try {
      await extractText(new Uint8Array([37,80,68,70]), { mergePages: true });
      steps.step2 = "ok";
    } catch (e) {
      steps.step2 = "expected error on dummy PDF: " + (e instanceof Error ? e.message : String(e));
    }

    // Step 3: Can we reach OpenRouter?
    steps.step3 = "checking openai client...";
    const { default: openai, MODEL } = await import("@/lib/openai");
    steps.step3 = `ok, model=${MODEL}`;

    // Step 4: Can we import mammoth?
    steps.step4 = "importing mammoth...";
    await import("mammoth");
    steps.step4 = "ok";

    return NextResponse.json({ ok: true, steps });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      failedAt: steps,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 5) : [],
    }, { status: 500 });
  }
}
