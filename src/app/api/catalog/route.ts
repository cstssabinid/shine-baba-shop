import { NextResponse } from "next/server";
import { getPublicCatalog } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getPublicCatalog(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ products: [], categories: [], error: "Catalog is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
