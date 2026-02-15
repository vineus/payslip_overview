import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const db = await getDb();
  db.run("DELETE FROM payslips WHERE id = ?", [numericId]);
  saveDb();
  return NextResponse.json({ success: true });
}
