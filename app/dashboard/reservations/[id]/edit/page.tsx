import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EditReservationForm from "./form";

export const instant = false;

export default async function EditReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: reservation,
    error: reservationError,
  } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_number,
      guest_id,
      place_id,
      arrival_date,
      departure_date,
      stay_type,
      stay_status,
      adults,
      children,
      price_per_night,
      notes,

      guests (
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .single();

  const {
    data: places,
    error: placesError,
  } = await supabase
    .from("places")
    .select(`
      id,
      code,
      name,
      place_type,
      capacity,
      has_power,
      active
    `)
    .eq("active", true)
    .order("code");

  if (
    reservationError ||
    placesError ||
    !reservation
  ) {
    return (
      <div>
        <h1>
          Reservasjonen kunne ikke lastes
        </h1>

        <Link href="/dashboard/reservations">
          ← Tilbake
        </Link>
      </div>
    );
  }

  const guest = reservation.guests;

  return (
    <div>
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#6b7a72",
          }}
        >
          Rediger reservasjon
        </div>

        <h1
          style={{
            fontSize: "30px",
            fontWeight: "800",
          }}
        >
          #{reservation.booking_number}
        </h1>

        {guest && (
          <div
            style={{
              marginTop: "4px",
            }}
          >
            {guest.first_name}{" "}
            {guest.last_name}
          </div>
        )}
      </div>

      <EditReservationForm
        reservation={{
          id: reservation.id,
          booking_number:
            reservation.booking_number,
          place_id:
            reservation.place_id,
          arrival_date:
            reservation.arrival_date,
          departure_date:
            reservation.departure_date,
          stay_type:
            reservation.stay_type,
          adults:
            reservation.adults,
          children:
            reservation.children,
          price_per_night:
            reservation.price_per_night,
          notes:
            reservation.notes,
        }}
        places={places ?? []}
        error={query.error}
      />
    </div>
  );
}