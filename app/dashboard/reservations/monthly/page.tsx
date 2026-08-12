import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Guest = {
  first_name: string;
  last_name: string;
};

type Place = {
  id: string;
  name: string;
  place_type: string;
};

type PaymentReservation = {
  id: string;
  booking_number:
    | string
    | number;
  guests:
    | Guest
    | Guest[]
    | null;
};

export default async function MonthlyOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
  }>;
}) {
  const params =
    await searchParams;

  const selectedMonth =
    isValidMonth(
      params.month
    )
      ? params.month!
      : currentMonthString();

  const [year, monthNumber] =
    selectedMonth
      .split("-")
      .map(Number);

  const monthIndex =
    monthNumber - 1;

  const monthStartDate =
    new Date(
      year,
      monthIndex,
      1
    );

  const nextMonthDate =
    new Date(
      year,
      monthIndex + 1,
      1
    );

  const monthStart =
    formatIsoDate(
      monthStartDate
    );

  const nextMonthStart =
    formatIsoDate(
      nextMonthDate
    );

  const supabase =
    await createClient();

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
        last_name
      ),

      places (
        id,
        name,
        place_type
      )
    `)
    .lt(
      "arrival_date",
      nextMonthStart
    )
    .gt(
      "departure_date",
      monthStart
    )
    .neq(
      "stay_status",
      "cancelled"
    )
    .order(
      "arrival_date",
      {
        ascending: true,
      }
    );

  const {
    data: payments,
    error: paymentError,
  } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_date,
      payment_method,
      reservation_id,

      reservations (
        id,
        booking_number,

        guests (
          first_name,
          last_name
        )
      )
    `)
    .gte(
      "payment_date",
      monthStart
    )
    .lt(
      "payment_date",
      nextMonthStart
    )
    .order(
      "payment_date",
      {
        ascending: true,
      }
    );

  if (
    reservationError ||
    paymentError
  ) {
    return (
      <div>
        <h1 style={titleStyle}>
          Månedsoversikt
        </h1>

        <div style={errorStyle}>
          Klarte ikke hente månedsdata.
        </div>
      </div>
    );
  }

  const list =
    reservations ?? [];

  const paymentList =
    payments ?? [];

  const totalNights =
    list.reduce(
      (
        sum,
        reservation
      ) =>
        sum +
        nightsInsideMonth(
          reservation.arrival_date,
          reservation.departure_date,
          monthStartDate,
          nextMonthDate
        ),
      0
    );

  const totalPeople =
    list.reduce(
      (
        sum,
        reservation
      ) =>
        sum +
        Number(
          reservation.adults || 0
        ) +
        Number(
          reservation.children || 0
        ),
      0
    );

  const motorhomeCount =
    list.filter(
      (reservation) =>
        reservation.stay_type ===
        "motorhome"
    ).length;

  const caravanCount =
    list.filter(
      (reservation) =>
        reservation.stay_type ===
        "caravan"
    ).length;

  const tentCount =
    list.filter(
      (reservation) =>
        reservation.stay_type ===
        "tent"
    ).length;

  const cabinCount =
    list.filter(
      (reservation) =>
        reservation.stay_type ===
        "cabin"
    ).length;

  const totalPaid =
    paymentList.reduce(
      (
        sum,
        payment
      ) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  const previousMonth =
    changeMonth(
      selectedMonth,
      -1
    );

  const nextMonth =
    changeMonth(
      selectedMonth,
      1
    );

  const monthTitle =
    monthStartDate.toLocaleDateString(
      "nb-NO",
      {
        month: "long",
        year: "numeric",
      }
    );

  return (
    <div>
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            Månedsoversikt
          </h1>

          <p style={subtitleStyle}>
            Statistikk og betalinger for valgt måned
          </p>
        </div>

        <Link
          href="/dashboard/reservations"
          style={
            secondaryButtonStyle
          }
        >
          ← Reservasjoner
        </Link>
      </div>

      <div style={monthToolbarStyle}>
        <Link
          href={`/dashboard/reservations/monthly?month=${previousMonth}`}
          style={
            secondaryButtonStyle
          }
        >
          ← Forrige måned
        </Link>

        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              textTransform:
                "capitalize",
            }}
          >
            {monthTitle}
          </div>

          <Link
            href={`/dashboard/reservations/monthly?month=${currentMonthString()}`}
            style={todayLinkStyle}
          >
            Gå til denne måneden
          </Link>
        </div>

        <Link
          href={`/dashboard/reservations/monthly?month=${nextMonth}`}
          style={
            secondaryButtonStyle
          }
        >
          Neste måned →
        </Link>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          title="Overnattinger"
          value={totalNights}
          subtitle="plass-netter"
        />

        <StatCard
          title="Personer"
          value={totalPeople}
          subtitle="på reservasjoner i måneden"
        />

        <StatCard
          title="Reservasjoner"
          value={list.length}
          subtitle="aktive opphold"
        />

        <StatCard
          title="Mottatt betaling"
          value={`${totalPaid.toLocaleString(
            "nb-NO"
          )} kr`}
          subtitle="etter betalingsdato"
        />
      </div>

      <div style={typeGridStyle}>
        <TypeCard
          label="Bobil"
          value={motorhomeCount}
        />

        <TypeCard
          label="Campingvogn"
          value={caravanCount}
        />

        <TypeCard
          label="Telt"
          value={tentCount}
        />

        <TypeCard
          label="Hytter"
          value={cabinCount}
        />
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
        }}
      >
        <div style={sectionTopStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              Opphold i måneden
            </h2>

            <p style={sectionSubtitleStyle}>
              Kun netter som faktisk faller i valgt måned telles
            </p>
          </div>

          <strong>
            {totalNights} netter
          </strong>
        </div>

        {list.length === 0 ? (
          <div style={emptyStyle}>
            Ingen reservasjoner i denne måneden.
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
                    Type
                  </th>

                  <th style={headerStyle}>
                    Plass
                  </th>

                  <th style={headerStyle}>
                    Periode
                  </th>

                  <th style={headerStyle}>
                    Netter i måneden
                  </th>

                  <th style={headerStyle}>
                    Personer
                  </th>

                  <th style={headerStyle}>
                    Åpne
                  </th>
                </tr>
              </thead>

              <tbody>
                {list.map(
                  (reservation) => {
                    const nights =
                      nightsInsideMonth(
                        reservation.arrival_date,
                        reservation.departure_date,
                        monthStartDate,
                        nextMonthDate
                      );

                    const people =
                      Number(
                        reservation.adults ||
                          0
                      ) +
                      Number(
                        reservation.children ||
                          0
                      );

                    const place =
                      getPlace(
                        reservation.places
                      );

                    return (
                      <tr
                        key={
                          reservation.id
                        }
                      >
                        <td style={cellStyle}>
                          #
                          {
                            reservation.booking_number
                          }
                        </td>

                        <td style={cellStyle}>
                          {guestName(
                            reservation
                          )}
                        </td>

                        <td style={cellStyle}>
                          {translateType(
                            reservation.stay_type
                          )}
                        </td>

                        <td style={cellStyle}>
                          {place?.name ||
                            "–"}
                        </td>

                        <td style={cellStyle}>
                          {formatDate(
                            reservation.arrival_date
                          )}{" "}
                          –{" "}
                          {formatDate(
                            reservation.departure_date
                          )}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight:
                              "800",
                          }}
                        >
                          {nights}
                        </td>

                        <td style={cellStyle}>
                          {people}
                        </td>

                        <td style={cellStyle}>
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

      <div style={cardStyle}>
        <div style={sectionTopStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              Betalinger mottatt i måneden
            </h2>

            <p style={sectionSubtitleStyle}>
              Basert på faktisk betalingsdato
            </p>
          </div>

          <div style={paidTotalStyle}>
            {totalPaid.toLocaleString(
              "nb-NO"
            )}{" "}
            kr
          </div>
        </div>

        {paymentList.length ===
        0 ? (
          <div style={emptyStyle}>
            Ingen betalinger registrert i denne måneden.
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
                    Dato
                  </th>

                  <th style={headerStyle}>
                    Booking
                  </th>

                  <th style={headerStyle}>
                    Gjest
                  </th>

                  <th style={headerStyle}>
                    Betalingsmåte
                  </th>

                  <th style={headerStyle}>
                    Beløp
                  </th>

                  <th style={headerStyle}>
                    Åpne
                  </th>
                </tr>
              </thead>

              <tbody>
                {paymentList.map(
                  (payment) => {
                    const reservation =
                      getPaymentReservation(
                        payment.reservations
                      );

                    return (
                      <tr
                        key={
                          payment.id
                        }
                      >
                        <td style={cellStyle}>
                          {formatDate(
                            payment.payment_date
                          )}
                        </td>

                        <td style={cellStyle}>
                          #
                          {reservation?.booking_number ??
                            "–"}
                        </td>

                        <td style={cellStyle}>
                          {reservation
                            ? paymentGuestName(
                                reservation
                              )
                            : "–"}
                        </td>

                        <td style={cellStyle}>
                          {translatePaymentMethod(
                            payment.payment_method
                          )}
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontWeight:
                              "800",
                            color:
                              "#235b3d",
                          }}
                        >
                          {Number(
                            payment.amount
                          ).toLocaleString(
                            "nb-NO"
                          )}{" "}
                          kr
                        </td>

                        <td style={cellStyle}>
                          {reservation?.id ? (
                            <Link
                              href={`/dashboard/reservations/${reservation.id}`}
                              style={
                                openButtonStyle
                              }
                            >
                              Åpne
                            </Link>
                          ) : (
                            "–"
                          )}
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

function getGuest(
  relation: unknown
): Guest | null {
  if (
    Array.isArray(relation)
  ) {
    return (
      (relation[0] as
        | Guest
        | undefined) ?? null
    );
  }

  return relation
    ? (relation as Guest)
    : null;
}

function getPlace(
  relation: unknown
): Place | null {
  if (
    Array.isArray(relation)
  ) {
    return (
      (relation[0] as
        | Place
        | undefined) ?? null
    );
  }

  return relation
    ? (relation as Place)
    : null;
}

function getPaymentReservation(
  relation: unknown
): PaymentReservation | null {
  if (
    Array.isArray(relation)
  ) {
    return (
      (relation[0] as
        | PaymentReservation
        | undefined) ?? null
    );
  }

  return relation
    ? (relation as PaymentReservation)
    : null;
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

function TypeCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={typeCardStyle}>
      <div>
        <div style={typeLabelStyle}>
          {label}
        </div>

        <div style={typeValueStyle}>
          {value}
        </div>
      </div>

      <span style={typeBadgeStyle}>
        reservasjoner
      </span>
    </div>
  );
}

function nightsInsideMonth(
  arrival: string,
  departure: string,
  monthStart: Date,
  nextMonthStart: Date
) {
  const arrivalDate =
    new Date(
      `${arrival}T00:00:00`
    );

  const departureDate =
    new Date(
      `${departure}T00:00:00`
    );

  const visibleStart =
    arrivalDate >
    monthStart
      ? arrivalDate
      : monthStart;

  const visibleEnd =
    departureDate <
    nextMonthStart
      ? departureDate
      : nextMonthStart;

  if (
    visibleEnd <=
    visibleStart
  ) {
    return 0;
  }

  return Math.round(
    (
      visibleEnd.getTime() -
      visibleStart.getTime()
    ) /
      86400000
  );
}

function guestName(
  reservation: any
) {
  const guest =
    getGuest(
      reservation.guests
    );

  if (!guest) {
    return "Ukjent gjest";
  }

  return `${guest.first_name} ${guest.last_name}`;
}

function paymentGuestName(
  reservation: PaymentReservation
) {
  const guest =
    getGuest(
      reservation.guests
    );

  if (!guest) {
    return "Ukjent gjest";
  }

  return `${guest.first_name} ${guest.last_name}`;
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

function translatePaymentMethod(
  method?: string | null
) {
  if (!method) {
    return "–";
  }

  const map: Record<
    string,
    string
  > = {
    card: "Kort",
    cash: "Kontant",
    vipps: "Vipps",
    bank: "Bank",
    online: "Online",
    other: "Annet",
  };

  return map[method] ?? method;
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

function currentMonthString() {
  const today =
    new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
}

function changeMonth(
  month: string,
  amount: number
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber -
        1 +
        amount,
      1
    );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function isValidMonth(
  value?: string
) {
  return Boolean(
    value &&
      /^\d{4}-\d{2}$/.test(
        value
      )
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

const monthToolbarStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr auto 1fr",
  alignItems: "center",
  gap: "15px",
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "20px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: "15px",
  marginBottom: "15px",
};

const typeGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
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

const statTitleStyle = {
  color: "#6b7a72",
  fontSize: "13px",
};

const statValueStyle = {
  fontSize: "29px",
  fontWeight: "800",
  marginTop: "5px",
};

const statSubtitleStyle = {
  color: "#6b7a72",
  fontSize: "11px",
  marginTop: "3px",
};

const typeCardStyle = {
  background: "#f7faf8",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "16px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "10px",
};

const typeLabelStyle = {
  color: "#6b7a72",
  fontSize: "12px",
};

const typeValueStyle = {
  fontSize: "26px",
  fontWeight: "800",
  marginTop: "3px",
};

const typeBadgeStyle = {
  background: "#e7efeb",
  color: "#315944",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "700",
};

const sectionTopStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "15px",
};

const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
};

const sectionSubtitleStyle = {
  color: "#6b7a72",
  fontSize: "12px",
  marginTop: "3px",
};

const secondaryButtonStyle = {
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "10px 14px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const todayLinkStyle = {
  display: "inline-block",
  marginTop: "5px",
  color: "#2f6f4e",
  fontWeight: "700",
  textDecoration: "none",
  fontSize: "11px",
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

const paidTotalStyle = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#235b3d",
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
  padding: "25px 0",
  color: "#6b7a72",
};

const errorStyle = {
  marginTop: "20px",
  padding: "15px",
  background: "#f8dddd",
  color: "#812d2d",
  borderRadius: "10px",
};