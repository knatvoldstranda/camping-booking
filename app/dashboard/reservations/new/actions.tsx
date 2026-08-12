"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createReservation(formData: FormData) {
  const supabase = await createClient();

  const guestMode = String(
    formData.get("guest_mode") || "existing"
  );

  let guestId = String(
    formData.get("guest_id") || ""
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -------------------------------------------------------
  // NY GJEST
  // -------------------------------------------------------

  if (guestMode === "new") {
    const firstName = String(
      formData.get("first_name") || ""
    ).trim();

    const lastName = String(
      formData.get("last_name") || ""
    ).trim();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    const email = String(
      formData.get("email") || ""
    ).trim();

    const country = String(
      formData.get("country") || ""
    ).trim();

    const vehicleReg = String(
      formData.get("vehicle_reg") || ""
    ).trim();

    if (!firstName || !lastName) {
      redirect(
        "/dashboard/reservations/new?error=" +
          encodeURIComponent(
            "Fornavn og etternavn må fylles ut for ny gjest."
          )
      );
    }

    const { data: newGuest, error: guestError } =
      await supabase
        .from("guests")
        .insert({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email: email || null,
          country: country || null,
          vehicle_reg: vehicleReg || null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

    if (guestError || !newGuest) {
      redirect(
        "/dashboard/reservations/new?error=" +
          encodeURIComponent(
            guestError?.message ||
              "Kunne ikke opprette gjesten."
          )
      );
    }

    guestId = newGuest.id;
  }

  // -------------------------------------------------------
  // EKSISTERENDE GJEST
  // -------------------------------------------------------

  if (guestMode === "existing" && !guestId) {
    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(
          "Du må velge en eksisterende gjest."
        )
    );
  }

  // -------------------------------------------------------
  // FELLES KONTROLLER
  // -------------------------------------------------------

  if (
    !placeId ||
    !arrivalDate ||
    !departureDate ||
    !stayType
  ) {
    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(
          "Alle obligatoriske reservasjonsfelt må fylles ut."
        )
    );
  }

  if (
    new Date(departureDate) <=
    new Date(arrivalDate)
  ) {
    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(
          "Avreisedato må være etter ankomstdato."
        )
    );
  }

  if (adults + children < 1) {
    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(
          "Reservasjonen må ha minst én person."
        )
    );
  }

  // -------------------------------------------------------
  // SPERRET GJEST
  // -------------------------------------------------------

  const { data: restriction } =
    await supabase
      .from("guest_restrictions")
      .select("blocked, reason")
      .eq("guest_id", guestId)
      .maybeSingle();

  if (restriction?.blocked) {
    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(
          `Gjesten er sperret og kan ikke reserveres. ${
            restriction.reason || ""
          }`
        )
    );
  }

  // -------------------------------------------------------
  // OPPRETT RESERVASJON
  // -------------------------------------------------------

  const { error } = await supabase
    .from("reservations")
    .insert({
      guest_id: guestId,
      place_id: placeId,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      stay_type: stayType,
      stay_status: "reserved",
      adults,
      children,
      price_per_night: pricePerNight,
      notes: notes || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    });

  if (error) {
    let message = error.message;

    if (
      error.code === "23P01" ||
      error.message
        .toLowerCase()
        .includes("reservations_no_overlap")
    ) {
      message =
        "Denne plassen er allerede reservert i hele eller deler av perioden.";
    }

    redirect(
      "/dashboard/reservations/new?error=" +
        encodeURIComponent(message)
    );
  }

  redirect(
    "/dashboard/reservations?success=1"
  );
}