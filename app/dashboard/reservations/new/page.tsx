import { createClient } from "@/lib/supabase/server";
import ReservationForm from "./form";

export const instant = false;

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    place?: string;
    arrival?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const { data: guests, error: guestError } =
    await supabase
      .from("guests")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        vehicle_reg
      `)
      .order("last_name");

  const { data: places, error: placeError } =
    await supabase
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

  const { data: alerts } = await supabase
    .from("guest_alerts")
    .select(`
      guest_id,
      enabled,
      message
    `)
    .eq("enabled", true);

  const { data: restrictions } =
    await supabase
      .from("guest_restrictions")
      .select(`
        guest_id,
        blocked,
        reason
      `)
      .eq("blocked", true);

  if (guestError || placeError) {
    return (
      <div>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "800",
          }}
        >
          Ny reservasjon
        </h1>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f8dddd",
            color: "#812d2d",
            borderRadius: "10px",
          }}
        >
          Klarte ikke hente nødvendige data fra databasen.
        </div>
      </div>
    );
  }

  const guestList =
    guests?.map((guest) => {
      const alert = alerts?.find(
        (item) => item.guest_id === guest.id
      );

      const restriction = restrictions?.find(
        (item) => item.guest_id === guest.id
      );

      return {
        ...guest,

        important_message:
          alert?.enabled
            ? alert.message
            : null,

        blocked:
          restriction?.blocked ?? false,

        blocked_reason:
          restriction?.reason ?? null,
      };
    }) ?? [];

  const allowedTypes = [
    "motorhome",
    "caravan",
    "tent",
    "cabin",
  ];

  const initialStayType =
    params.type &&
    allowedTypes.includes(params.type)
      ? params.type
      : "motorhome";

  const initialPlaceId =
    places?.some(
      (place) =>
        place.id === params.place
    )
      ? params.place ?? ""
      : "";

  const initialArrival =
    params.arrival &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      params.arrival
    )
      ? params.arrival
      : "";

  return (
    <ReservationForm
      guests={guestList}
      places={places ?? []}
      error={params.error}
      initialPlaceId={initialPlaceId}
      initialStayType={initialStayType}
      initialArrival={initialArrival}
    />
  );
}