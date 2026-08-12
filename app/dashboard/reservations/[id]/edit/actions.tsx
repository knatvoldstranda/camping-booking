"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateReservation(formData: FormData) {
  const supabase = await createClient();

  const reservationId = String(
    formData.get("reservation_id") || ""
  );

  const placeId = String(
    formData.get("place_id") || ""
  );

  const arrivalDate = String(
    formData.get("arrival_date") || ""
  );

  const departureDate = String(
    formData.get("departure_date") || ""
  );

  const stayType = String(
    formData.get("stay_type") || ""
  );

  const adults = Number(
    formData.get("adults") || 0
  );

  const children = Number(
    formData.get("children") || 0
  );

  const pricePerNight = Number(
    formData.get("price_per_night") || 0
  );

  const notes = String(
    formData.get("notes") || ""
  ).trim();

  if (
    !reservationId ||
    !placeId ||
    !arrivalDate ||
    !departureDate ||
    !stayType
  ) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Alle obligatoriske felt må fylles ut."
      )}`
    );
  }

  if (
    new Date(`${departureDate}T00:00:00`) <=
    new Date(`${arrivalDate}T00:00:00`)
  ) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Avreisedato må være etter ankomstdato."
      )}`
    );
  }

  if (adults + children < 1) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Reservasjonen må ha minst én person."
      )}`
    );
  }

  if (pricePerNight < 0) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Pris per natt kan ikke være negativ."
      )}`
    );
  }

  const { data: place, error: placeError } =
    await supabase
      .from("places")
      .select("id, place_type, active")
      .eq("id", placeId)
      .single();

  if (placeError || !place || !place.active) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Den valgte plassen er ikke tilgjengelig."
      )}`
    );
  }

  const expectedPlaceType =
    stayType === "tent"
      ? "tent"
      : stayType === "cabin"
      ? "cabin"
      : "motorhome_caravan";

  if (place.place_type !== expectedPlaceType) {
    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        "Valgt plass passer ikke med valgt type opphold."
      )}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reservations")
    .update({
      place_id: placeId,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      stay_type: stayType,
      adults,
      children,
      price_per_night: pricePerNight,
      notes: notes || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", reservationId);

  if (error) {
    let message = error.message;

    if (
      error.code === "23P01" ||
      error.message
        .toLowerCase()
        .includes("reservations_no_overlap")
    ) {
      message =
        "Denne plassen er allerede reservert i hele eller deler av perioden. Velg en annen plass eller andre datoer.";
    }

    redirect(
      `/dashboard/reservations/${reservationId}/edit?error=${encodeURIComponent(
        message
      )}`
    );
  }

  redirect(
    `/dashboard/reservations/${reservationId}?updated=1`
  );
}