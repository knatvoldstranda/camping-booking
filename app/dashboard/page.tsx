import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = formatIsoDate(new Date());

  const tomorrowDate = new Date();
  tomorrowDate.setDate(
    tomorrowDate.getDate() + 1
  );

  const tomorrow =
    formatIsoDate(tomorrowDate);

  const {
    data: reservations,
    error: reservationError,
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
        name,
        place_type
      ),

      payments (
        amount
      )
    `)
    .neq(
      "stay_status",
      "cancelled"
    )
    .lte(
      "arrival_date",
      tomorrow
    )
    .gte(
      "departure_date",
      today
    );

  const {
    data: allActiveReservations,
  } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_number,
      arrival_date,
      departure_date,
      stay_status,
      adults,
      children,
      price_per_night,

      guests (
        id,
        first_name,
        last_name
      ),

      places (
        id,
        name
      ),

      payments (
        amount
      )
    `)
    .neq(
      "stay_status",
      "cancelled"
    );

  const {
    data: activePlaces,
    error: placesError,
  } = await supabase
    .from("places")
    .select(`
      id,
      name,
      place_type
    `)
    .eq(
      "active",
      true
    );

  if (
    reservationError ||
    placesError
  ) {
    return (
      <div>
        <h1 style={titleStyle}>
          Dashboard
        </h1>

        <div style={errorStyle}>
          Klarte ikke hente data til dashboardet.
        </div>
      </div>
    );
  }

  const list =
    reservations ?? [];

  const allReservations =
    allActiveReservations ?? [];

  const places =
    activePlaces ?? [];

  // --------------------------------------------------
  // DAGENS ANKOMSTER
  // --------------------------------------------------

  const arrivalsToday =
    list
      .filter(
        (reservation) =>
          reservation.arrival_date ===
          today
      )
      .sort((a, b) =>
        guestName(a).localeCompare(
          guestName(b)
        )
      );

  // --------------------------------------------------
  // DAGENS AVGANGER
  // --------------------------------------------------

  const departuresToday =
    list
      .filter(
        (reservation) =>
          reservation.departure_date ===
          today
      )
      .sort((a, b) =>
        guestName(a).localeCompare(
          guestName(b)
        )
      );

  // --------------------------------------------------
  // INNSJEKKET
  // --------------------------------------------------

  const checkedIn =
    allReservations.filter(
      (reservation) =>
        reservation.stay_status ===
        "checked_in"
    );

  // --------------------------------------------------
  // GJESTER SOM BOR HER I DAG
  // Ankomst teller med.
  // Avreisedagen teller ikke som overnatting.
  // --------------------------------------------------

  const stayingToday =
    allReservations.filter(
      (reservation) =>
        reservation.arrival_date <=
          today &&
        reservation.departure_date >
          today
    );

  const peopleToday =
    stayingToday.reduce(
      (sum, reservation) =>
        sum +
        Number(
          reservation.adults || 0
        ) +
        Number(
          reservation.children || 0
        ),
      0
    );

  // --------------------------------------------------
  // BELEGG
  // --------------------------------------------------

  const occupiedPlaceIds =
    new Set(
      stayingToday
        .map(
          (reservation) =>
            reservation.places?.id
        )
        .filter(Boolean)
    );

  const occupiedPlaces =
    occupiedPlaceIds.size;

  const totalPlaces =
    places.length;

  const occupancyPercent =
    totalPlaces > 0
      ? Math.round(
          (occupiedPlaces /
            totalPlaces) *
            100
        )
      : 0;

  // --------------------------------------------------
  // UBETALTE / DELVIS BETALTE
  // --------------------------------------------------

  const unpaidReservations =
    allReservations
      .map((reservation) => {
        const nights =
          calculateNights(
            reservation.arrival_date,
            reservation.departure_date
          );

        const total =
          nights *
          Number(
            reservation.price_per_night ||
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

        return {
          ...reservation,
          total,
          paid,
          remaining:
            Math.max(
              0,
              total - paid
            ),
        };
      })
      .filter(
        (reservation) =>
          reservation.remaining >
          0
      )
      .sort(
        (a, b) =>
          b.remaining -
          a.remaining
      );

  const totalOutstanding =
    unpaidReservations.reduce(
      (sum, reservation) =>
        sum +
        reservation.remaining,
      0
    );

  return (
    <div>
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            Dashboard
          </h1>

          <p style={subtitleStyle}>
            Drift i dag –{" "}
            {new Date(
              `${today}T00:00:00`
            ).toLocaleDateString(
              "nb-NO",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
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
            href="/dashboard/calendar"
            style={secondaryButtonStyle}
          >
            Åpne kalender
          </Link>

          <Link
            href="/dashboard/reservations/new"
            prefetch={false}
            style={primaryButtonStyle}
          >
            + Ny reservasjon
          </Link>
        </div>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          title="Ankomster i dag"
          value={
            arrivalsToday.length
          }
          subtitle="reservasjoner"
        />

        <StatCard
          title="Avganger i dag"
          value={
            departuresToday.length
          }
          subtitle="reservasjoner"
        />

        <StatCard
          title="Gjester på plassen"
          value={
            peopleToday
          }
          subtitle={`${occupiedPlaces} plasser i bruk`}
        />

        <StatCard
          title="Belegg i dag"
          value={`${occupancyPercent}%`}
          subtitle={`${occupiedPlaces} av ${totalPlaces} plasser`}
        />

        <StatCard
          title="Innsjekket"
          value={
            checkedIn.length
          }
          subtitle="reservasjoner"
        />

        <StatCard
          title="Utestående"
          value={`${totalOutstanding.toLocaleString(
            "nb-NO"
          )} kr`}
          subtitle={`${unpaidReservations.length} reservasjoner`}
        />
      </div>

      <div style={twoColumnStyle}>
        <DashboardSection
          title="Ankomster i dag"
          count={
            arrivalsToday.length
          }
        >
          <ReservationList
            reservations={
              arrivalsToday
            }
            emptyText="Ingen ankomster i dag."
            show="arrival"
          />
        </DashboardSection>

        <DashboardSection
          title="Avganger i dag"
          count={
            departuresToday.length
          }
        >
          <ReservationList
            reservations={
              departuresToday
            }
            emptyText="Ingen avganger i dag."
            show="departure"
          />
        </DashboardSection>
      </div>

      <div style={twoColumnStyle}>
        <DashboardSection
          title="Innsjekkede gjester"
          count={
            checkedIn.length
          }
        >
          <ReservationList
            reservations={
              checkedIn
            }
            emptyText="Ingen gjester er markert som innsjekket."
            show="stay"
          />
        </DashboardSection>

        <DashboardSection
          title="Dagens belegg"
          count={
            occupiedPlaces
          }
        >
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: "7px",
                fontSize: "13px",
              }}
            >
              <span>
                {occupiedPlaces} av{" "}
                {totalPlaces} plasser
              </span>

              <strong>
                {occupancyPercent}%
              </strong>
            </div>

            <div
              style={{
                height: "12px",
                background:
                  "#e7efeb",
                borderRadius:
                  "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    occupancyPercent,
                    100
                  )}%`,
                  height: "100%",
                  background:
                    "#2f6f4e",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            <SmallStat
              label="Bobil / vogn"
              value={countOccupiedByType(
                stayingToday,
                "motorhome_caravan"
              )}
            />

            <SmallStat
              label="Telt"
              value={countOccupiedByType(
                stayingToday,
                "tent"
              )}
            />

            <SmallStat
              label="Hytter"
              value={countOccupiedByType(
                stayingToday,
                "cabin"
              )}
            />
          </div>
        </DashboardSection>
      </div>

      <div
        style={{
          ...cardStyle,
          marginTop: "20px",
        }}
      >
        <div style={sectionTopStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              Ubetalte og delvis betalte
            </h2>

            <p style={sectionSubtitleStyle}>
              Reservasjoner med utestående beløp
            </p>
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#812d2d",
            }}
          >
            {totalOutstanding.toLocaleString(
              "nb-NO"
            )}{" "}
            kr
          </div>
        </div>

        {unpaidReservations.length ===
        0 ? (
          <div style={emptyStyle}>
            Ingen utestående betalinger.
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
                    Totalpris
                  </th>

                  <th style={headerStyle}>
                    Betalt
                  </th>

                  <th style={headerStyle}>
                    Gjenstår
                  </th>

                  <th style={headerStyle}>
                    Åpne
                  </th>
                </tr>
              </thead>

              <tbody>
                {unpaidReservations
                  .slice(0, 10)
                  .map(
                    (reservation) => (
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
                          #
                          {
                            reservation.booking_number
                          }
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {guestName(
                            reservation
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
                          {reservation.total.toLocaleString(
                            "nb-NO"
                          )}{" "}
                          kr
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {reservation.paid.toLocaleString(
                            "nb-NO"
                          )}{" "}
                          kr
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight:
                              "800",
                            color:
                              "#812d2d",
                          }}
                        >
                          {reservation.remaining.toLocaleString(
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
                    )
                  )}
              </tbody>
            </table>
          </div>
        )}

        {unpaidReservations.length >
          10 && (
          <div
            style={{
              marginTop: "15px",
            }}
          >
            <Link
              href="/dashboard/reservations"
              style={textLinkStyle}
            >
              Se alle reservasjoner →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={sectionTopStyle}>
        <h2 style={sectionTitleStyle}>
          {title}
        </h2>

        <span style={countBadgeStyle}>
          {count}
        </span>
      </div>

      {children}
    </div>
  );
}

function ReservationList({
  reservations,
  emptyText,
  show,
}: {
  reservations: any[];
  emptyText: string;
  show:
    | "arrival"
    | "departure"
    | "stay";
}) {
  if (
    reservations.length === 0
  ) {
    return (
      <div style={emptyStyle}>
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      {reservations
        .slice(0, 8)
        .map(
          (reservation) => (
            <Link
              key={reservation.id}
              href={`/dashboard/reservations/${reservation.id}`}
              style={reservationRowStyle}
            >
              <div>
                <div
                  style={{
                    fontWeight:
                      "800",
                  }}
                >
                  {guestName(
                    reservation
                  )}
                </div>

                <div
                  style={{
                    color:
                      "#6b7a72",
                    fontSize:
                      "12px",
                    marginTop:
                      "3px",
                  }}
                >
                  {reservation.places
                    ?.name || "–"}
                </div>
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <div
                  style={{
                    fontWeight:
                      "700",
                  }}
                >
                  {show ===
                    "arrival" &&
                    "Ankomst i dag"}

                  {show ===
                    "departure" &&
                    "Avreise i dag"}

                  {show ===
                    "stay" &&
                    `${formatDate(
                      reservation.arrival_date
                    )} – ${formatDate(
                      reservation.departure_date
                    )}`}
                </div>

                <div
                  style={{
                    color:
                      "#6b7a72",
                    fontSize:
                      "12px",
                    marginTop:
                      "3px",
                  }}
                >
                  {Number(
                    reservation.adults ||
                      0
                  ) +
                    Number(
                      reservation.children ||
                        0
                    )}{" "}
                  personer
                </div>
              </div>
            </Link>
          )
        )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={statTitleStyle}>
        {title}
      </div>

      <div style={statValueStyle}>
        {value}
      </div>

      <div style={statSubtitleStyle}>
        {subtitle}
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        background:
          "#f7faf8",
        borderRadius:
          "10px",
        padding:
          "12px",
      }}
    >
      <div
        style={{
          color:
            "#6b7a72",
          fontSize:
            "11px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            "22px",
          fontWeight:
            "800",
          marginTop:
            "3px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function countOccupiedByType(
  reservations: any[],
  type: string
) {
  return new Set(
    reservations
      .filter(
        (reservation) =>
          reservation.places
            ?.place_type ===
          type
      )
      .map(
        (reservation) =>
          reservation.places?.id
      )
      .filter(Boolean)
  ).size;
}

function guestName(
  reservation: any
) {
  const guest =
    reservation.guests;

  if (!guest) {
    return "Ukjent gjest";
  }

  return `${guest.first_name} ${guest.last_name}`;
}

function calculateNights(
  arrival: string,
  departure: string
) {
  return Math.round(
    (
      new Date(
        `${departure}T00:00:00`
      ).getTime() -
      new Date(
        `${arrival}T00:00:00`
      ).getTime()
    ) /
      86400000
  );
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

function formatIsoDate(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const topStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap: "20px",
  marginBottom:
    "25px",
};

const titleStyle = {
  fontSize:
    "30px",
  fontWeight:
    "800",
  marginBottom:
    "5px",
};

const subtitleStyle = {
  color:
    "#6b7a72",
  textTransform:
    "capitalize" as const,
};

const statsGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap:
    "15px",
  marginBottom:
    "20px",
};

const twoColumnStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap:
    "20px",
  marginBottom:
    "20px",
};

const cardStyle = {
  background:
    "white",
  border:
    "1px solid #dbe4df",
  borderRadius:
    "14px",
  padding:
    "18px",
};

const statTitleStyle = {
  color:
    "#6b7a72",
  fontSize:
    "13px",
};

const statValueStyle = {
  fontSize:
    "30px",
  fontWeight:
    "800",
  marginTop:
    "5px",
};

const statSubtitleStyle = {
  color:
    "#6b7a72",
  fontSize:
    "12px",
  marginTop:
    "3px",
};

const sectionTopStyle = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "15px",
  marginBottom:
    "15px",
};

const sectionTitleStyle = {
  fontSize:
    "19px",
  fontWeight:
    "800",
};

const sectionSubtitleStyle = {
  color:
    "#6b7a72",
  fontSize:
    "12px",
  marginTop:
    "3px",
};

const countBadgeStyle = {
  minWidth:
    "28px",
  height:
    "28px",
  display:
    "inline-grid",
  placeItems:
    "center",
  borderRadius:
    "999px",
  background:
    "#e7efeb",
  color:
    "#315944",
  fontWeight:
    "800",
  fontSize:
    "12px",
};

const reservationRowStyle = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "15px",
  padding:
    "12px 0",
  borderBottom:
    "1px solid #e5ebe8",
  color:
    "#1d2a24",
  textDecoration:
    "none",
};

const primaryButtonStyle = {
  background:
    "#2f6f4e",
  color:
    "white",
  padding:
    "11px 15px",
  borderRadius:
    "9px",
  textDecoration:
    "none",
  fontWeight:
    "700",
};

const secondaryButtonStyle = {
  background:
    "#e7efeb",
  color:
    "#1d2a24",
  padding:
    "11px 15px",
  borderRadius:
    "9px",
  textDecoration:
    "none",
  fontWeight:
    "700",
};

const openButtonStyle = {
  background:
    "#e7efeb",
  color:
    "#1d2a24",
  padding:
    "7px 10px",
  borderRadius:
    "8px",
  textDecoration:
    "none",
  fontWeight:
    "700",
  fontSize:
    "12px",
};

const textLinkStyle = {
  color:
    "#2f6f4e",
  fontWeight:
    "700",
  textDecoration:
    "none",
};

const tableStyle = {
  width:
    "100%",
  borderCollapse:
    "collapse" as const,
};

const headerStyle = {
  textAlign:
    "left" as const,
  padding:
    "10px",
  borderBottom:
    "1px solid #dbe4df",
  fontSize:
    "12px",
  color:
    "#6b7a72",
};

const cellStyle = {
  padding:
    "12px 10px",
  borderBottom:
    "1px solid #e5ebe8",
};

const emptyStyle = {
  padding:
    "20px 0",
  color:
    "#6b7a72",
};

const errorStyle = {
  marginTop:
    "20px",
  padding:
    "15px",
  background:
    "#f8dddd",
  color:
    "#812d2d",
  borderRadius:
    "10px",
};