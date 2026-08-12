import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

type Place = {
  id: string;
  code: string;
  name: string;
};

export default async function ReservationsPage() {
  const supabase = await createClient();

  const {
    data: reservations,
    error,
  } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_number,
      arrival_date,
      departure_date,
      stay_type,
      stay_status,
      adults,
      children,
      price_per_night,

      guests (
        id,
        first_name,
        last_name,
        phone,
        email
      ),

      places (
        id,
        code,
        name
      ),

      payments (
        amount
      )
    `)
    .order(
      "arrival_date",
      {
        ascending: false,
      }
    );

  if (error) {
    return (
      <div>
        <h1 style={titleStyle}>
          Reservasjoner
        </h1>

        <div style={errorStyle}>
          Feil ved henting av reservasjoner:{" "}
          {error.message}
        </div>
      </div>
    );
  }

  const list =
    reservations ?? [];

  const totalPaid =
    list.reduce(
      (
        total,
        reservation
      ) =>
        total +
        (
          reservation.payments ??
          []
        ).reduce(
          (
            sum,
            payment
          ) =>
            sum +
            Number(
              payment.amount || 0
            ),
          0
        ),
      0
    );

  const activeReservations =
    list.filter(
      (reservation) =>
        reservation.stay_status !==
        "cancelled"
    ).length;

  return (
    <div>
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            Reservasjoner
          </h1>

          <p style={subtitleStyle}>
            Oversikt over alle reservasjoner
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard/reservations/monthly"
            style={monthlyButtonStyle}
          >
            Månedsoversikt
          </Link>

          <Link
            href="/dashboard/reservations/new"
            prefetch={false}
            style={primaryLinkStyle}
          >
            + Ny reservasjon
          </Link>
        </div>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          title="Totalt"
          value={list.length}
        />

        <StatCard
          title="Aktive"
          value={activeReservations}
        />

        <StatCard
          title="Mottatt betaling"
          value={`${totalPaid.toLocaleString(
            "nb-NO"
          )} kr`}
        />
      </div>

      <div style={cardStyle}>
        {list.length === 0 ? (
          <div style={emptyStyle}>
            Ingen reservasjoner registrert ennå.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerStyle}>
                    Booking
                  </th>

                  <th style={headerStyle}>
                    Gjest
                  </th>

                  <th style={headerStyle}>
                    Periode
                  </th>

                  <th style={headerStyle}>
                    Plass
                  </th>

                  <th style={headerStyle}>
                    Type
                  </th>

                  <th style={headerStyle}>
                    Personer
                  </th>

                  <th style={headerStyle}>
                    Status
                  </th>

                  <th style={headerStyle}>
                    Betalt
                  </th>

                  <th style={headerStyle}>
                    Åpne
                  </th>
                </tr>
              </thead>

              <tbody>
                {list.map(
                  (
                    reservation
                  ) => {
                    const guestRelation =
                      reservation.guests;

                    const guest: Guest | null =
                      Array.isArray(
                        guestRelation
                      )
                        ? (
                            guestRelation[0] as
                              | Guest
                              | undefined
                          ) ?? null
                        : (guestRelation as
                            | Guest
                            | null);

                    const placeRelation =
                      reservation.places;

                    const place: Place | null =
                      Array.isArray(
                        placeRelation
                      )
                        ? (
                            placeRelation[0] as
                              | Place
                              | undefined
                          ) ?? null
                        : (placeRelation as
                            | Place
                            | null);

                    const people =
                      Number(
                        reservation.adults ||
                          0
                      ) +
                      Number(
                        reservation.children ||
                          0
                      );

                    const paid =
                      (
                        reservation.payments ??
                        []
                      ).reduce(
                        (
                          sum,
                          payment
                        ) =>
                          sum +
                          Number(
                            payment.amount ||
                              0
                          ),
                        0
                      );

                    return (
                      <tr
                        key={
                          reservation.id
                        }
                      >
                        <td
                          style={
                            cellStyle
                          }
                        >
                          <Link
                            href={`/dashboard/reservations/${reservation.id}`}
                            style={
                              reservationLinkStyle
                            }
                          >
                            #
                            {
                              reservation.booking_number
                            }
                          </Link>
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {guest ? (
                            <Link
                              href={`/dashboard/reservations/${reservation.id}`}
                              style={
                                reservationLinkStyle
                              }
                            >
                              {
                                guest.first_name
                              }{" "}
                              {
                                guest.last_name
                              }
                            </Link>
                          ) : (
                            "–"
                          )}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {formatDate(
                            reservation.arrival_date
                          )}{" "}
                          –{" "}
                          {formatDate(
                            reservation.departure_date
                          )}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {place?.name ||
                            "–"}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {translateType(
                            reservation.stay_type
                          )}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {people}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          <StatusBadge
                            status={
                              reservation.stay_status
                            }
                          />
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {paid.toLocaleString(
                            "nb-NO"
                          )}{" "}
                          kr
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          <Link
                            href={`/dashboard/reservations/${reservation.id}`}
                            style={
                              openButtonStyle
                            }
                          >
                            Åpne
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div style={cardStyle}>
      <div style={statLabelStyle}>
        {title}
      </div>

      <div style={statValueStyle}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<
    string,
    {
      label: string;
      background: string;
      color: string;
    }
  > = {
    reserved: {
      label: "Reservert",
      background: "#e7efeb",
      color: "#315944",
    },

    checked_in: {
      label: "Innsjekket",
      background: "#dff1e7",
      color: "#235b3d",
    },

    checked_out: {
      label: "Utsjekket",
      background: "#eeeeee",
      color: "#555555",
    },

    no_show: {
      label: "Ikke møtt",
      background: "#fff0c9",
      color: "#805b08",
    },

    cancelled: {
      label: "Avbestilt",
      background: "#f7dddd",
      color: "#812d2d",
    },
  };

  const value =
    map[status] ??
    map.reserved;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "999px",
        background:
          value.background,
        color: value.color,
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      {value.label}
    </span>
  );
}

function translateType(
  type: string
) {
  const map: Record<
    string,
    string
  > = {
    motorhome: "Bobil",
    caravan:
      "Campingvogn",
    tent: "Telt",
    cabin: "Hytte",
  };

  return map[type] ?? type;
}

function formatDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "nb-NO"
  );
}

const topStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "25px",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "800",
  marginBottom: "5px",
};

const subtitleStyle = {
  color: "#6b7a72",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "18px",
};

const statLabelStyle = {
  color: "#6b7a72",
  fontSize: "13px",
};

const statValueStyle = {
  fontSize: "28px",
  fontWeight: "800",
  marginTop: "5px",
};

const primaryLinkStyle = {
  display: "inline-block",
  background: "#2f6f4e",
  color: "white",
  padding: "11px 15px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const monthlyButtonStyle = {
  display: "inline-block",
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "11px 15px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const reservationLinkStyle = {
  color: "#2f6f4e",
  fontWeight: "800",
  textDecoration: "none",
};

const openButtonStyle = {
  display: "inline-block",
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "7px 10px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "12px",
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse" as const,
};

const headerStyle = {
  textAlign:
    "left" as const,
  padding: "10px",
  borderBottom:
    "1px solid #dbe4df",
  fontSize: "12px",
  color: "#6b7a72",
};

const cellStyle = {
  padding: "12px 10px",
  borderBottom:
    "1px solid #e5ebe8",
};

const emptyStyle = {
  padding: "35px",
  textAlign:
    "center" as const,
  color: "#6b7a72",
};

const errorStyle = {
  marginTop: "20px",
  padding: "15px",
  background: "#f8dddd",
  color: "#812d2d",
  borderRadius: "10px",
};