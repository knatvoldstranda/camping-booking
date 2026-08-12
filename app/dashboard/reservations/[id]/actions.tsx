"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateReservationStatus(
  formData: FormData
) {
  const supabase = await createClient();

  const reservationId = String(
    formData.get("reservation_id") || ""
  );

  const status = String(
    formData.get("stay_status") || ""
  );

  const allowedStatuses = [
    "reserved",
    "checked_in",
    "checked_out",
    "no_show",
    "cancelled",
  ];

  if (
    !reservationId ||
    !allowedStatuses.includes(status)
  ) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reservations")
    .update({
      stay_status: status,
      updated_by: user?.id ?? null,
    })
    .eq("id", reservationId);

  if (error) {
    redirect(
      `/dashboard/reservations/${reservationId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath(
    `/dashboard/reservations/${reservationId}`
  );

  revalidatePath("/dashboard/reservations");
}

export async function addPayment(
  formData: FormData
) {
  const supabase = await createClient();

  const reservationId = String(
    formData.get("reservation_id") || ""
  );

  const amount = Number(
    formData.get("amount") || 0
  );

  const paymentDate = String(
    formData.get("payment_date") || ""
  );

  const paymentMethod = String(
    formData.get("payment_method") || ""
  );

  const reference = String(
    formData.get("reference") || ""
  ).trim();

  const notes = String(
    formData.get("payment_notes") || ""
  ).trim();

  if (!reservationId || amount <= 0) {
    redirect(
      `/dashboard/reservations/${reservationId}?error=${encodeURIComponent(
        "Betalingsbeløpet må være større enn 0."
      )}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("payments")
    .insert({
      reservation_id: reservationId,
      amount,
      payment_date:
        paymentDate ||
        new Date().toISOString().slice(0, 10),

      payment_method:
        paymentMethod || null,

      reference:
        reference || null,

      notes:
        notes || null,

      created_by:
        user?.id ?? null,
    });

  if (error) {
    redirect(
      `/dashboard/reservations/${reservationId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath(
    `/dashboard/reservations/${reservationId}`
  );

  revalidatePath("/dashboard/reservations");
}

export async function updateReservationNotes(
  formData: FormData
) {
  const supabase = await createClient();

  const reservationId = String(
    formData.get("reservation_id") || ""
  );

  const notes = String(
    formData.get("notes") || ""
  ).trim();

  if (!reservationId) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reservations")
    .update({
      notes:
        notes || null,

      updated_by:
        user?.id ?? null,
    })
    .eq("id", reservationId);

  if (error) {
    redirect(
      `/dashboard/reservations/${reservationId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath(
    `/dashboard/reservations/${reservationId}`
  );
}