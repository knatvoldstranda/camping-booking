"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveGuestNote(formData: FormData) {
  const supabase = await createClient();

  const guestId = String(formData.get("guest_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!guestId || !note) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("guest_notes").insert({
    guest_id: guestId,
    note,
    created_by: user?.id ?? null,
  });

  revalidatePath(`/dashboard/guests/${guestId}`);
}

export async function saveGuestAlert(formData: FormData) {
  const supabase = await createClient();

  const guestId = String(formData.get("guest_id") || "");
  const message = String(formData.get("message") || "").trim();
  const enabled = formData.get("enabled") === "on";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!guestId) return;

  if (!enabled) {
    await supabase
      .from("guest_alerts")
      .delete()
      .eq("guest_id", guestId);

    revalidatePath(`/dashboard/guests/${guestId}`);
    return;
  }

  if (!message) return;

  await supabase
    .from("guest_alerts")
    .upsert(
      {
        guest_id: guestId,
        enabled: true,
        message,
        updated_by: user?.id ?? null,
        created_by: user?.id ?? null,
      },
      {
        onConflict: "guest_id",
      }
    );

  revalidatePath(`/dashboard/guests/${guestId}`);
}

export async function saveGuestRestriction(formData: FormData) {
  const supabase = await createClient();

  const guestId = String(formData.get("guest_id") || "");
  const reason = String(formData.get("reason") || "").trim();
  const blocked = formData.get("blocked") === "on";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!guestId) return;

  if (!blocked) {
    await supabase
      .from("guest_restrictions")
      .delete()
      .eq("guest_id", guestId);

    revalidatePath(`/dashboard/guests/${guestId}`);
    return;
  }

  await supabase
    .from("guest_restrictions")
    .upsert(
      {
        guest_id: guestId,
        blocked: true,
        reason: reason || null,
        updated_by: user?.id ?? null,
        created_by: user?.id ?? null,
      },
      {
        onConflict: "guest_id",
      }
    );

  revalidatePath(`/dashboard/guests/${guestId}`);
}