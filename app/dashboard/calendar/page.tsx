import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Category =
  | "motorhome_caravan"
  | "tent"
  | "cabin";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedMonth =
    isValidMonth(params.month)
      ? params.month!
      : currentMonthString();

  const selectedCategory: Category =
    params.category === "tent"
      ? "tent"
      : params.category === "cabin"
      ? "cabin"
      : "motorhome_caravan";

  const [year, monthNumber] =
    selectedMonth.split("-").map(Number);

  const monthIndex =
    monthNumber - 1;

  const firstDay =
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

  const daysInMonth =
    new Date(
      year,
      monthIndex + 1,
      0
    ).getDate();

  const monthStart =
    formatIsoDate(firstDay);

  const nextMonthStart =
    formatIsoDate(nextMonthDate);

  const supabase =
    await createClient();

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
    .eq(
      "place_type",
      selectedCategory
    )
    .eq("active", true)
    .order("code");

  const {
    data: reservations,
    error: reservationsError,
  } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_number,
      place_id,
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

      payments (
        amount
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
    );

  if (
    placesError ||
    reservationsError
  ) {
    return (
      <div>
        <h1 style={titleStyle}>
          Kalender
        </h1>

        <div style={errorStyle}>
          Klarte ikke hente kalenderdata.
        </div>
      </div>
    );
  }

  const placeList =
    places ?? [];

  const reservationList =
    reservations ?? [];

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

  const today =
    formatIsoDate(
      new Date()
    );

  const monthTitle =
    firstDay.toLocaleDateString(
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
            Reservasjonskalender
          </h1>

          <p style={subtitleStyle}>
            Klikk på en ledig dato for å opprette reservasjon
          </p>
        </div>

        <Link
          href="/dashboard/reservations/new"
          prefetch={false}
          style={primaryButtonStyle}
        >
          + Ny reservasjon
        </Link>
      </div>

      <div style={cardStyle}>
        <div
          style={calendarToolbarStyle}
        >
          <Link
            href={calendarUrl(
              previousMonth,
              selectedCategory
            )}
            style={secondaryButtonStyle}
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
                fontSize: "22px",
                fontWeight: "800",
                textTransform:
                  "capitalize",
              }}
            >
              {monthTitle}
            </div>

            <Link
              href={calendarUrl(
                currentMonthString(),
                selectedCategory
              )}
              style={todayLinkStyle}
            >
              Gå til denne måneden
            </Link>
          </div>

          <Link
            href={calendarUrl(
              nextMonth,
              selectedCategory
            )}
            style={secondaryButtonStyle}
          >
            Neste måned →
          </Link>
        </div>

        <div style={tabsStyle}>
          <CategoryTab
            label="Bobil / Campingvogn"
            category="motorhome_caravan"
            month={selectedMonth}
            active={
              selectedCategory ===
              "motorhome_caravan"
            }
            count={
              selectedCategory ===
              "motorhome_caravan"
                ? placeList.length
                : 6
            }
          />

          <CategoryTab
            label="Teltplasser"
            category="tent"
            month={selectedMonth}
            active={
              selectedCategory ===
              "tent"
            }
            count={
              selectedCategory ===
              "tent"
                ? placeList.length
                : 10
            }
          />

          <CategoryTab
            label="Hytter"
            category="cabin"
            month={selectedMonth}
            active={
              selectedCategory ===
              "cabin"
            }
            count={
              selectedCategory ===
              "cabin"
                ? placeList.length
                : 5
            }
          />
        </div>

        <div style={legendStyle}>
          <Legend
            color="#dff1e7"
            label="Betalt"
          />

          <Legend
            color="#fff0c9"
            label="Delvis betalt"
          />

          <Legend
            color="#f7dddd"
            label="Ikke betalt"
          />

          <Legend
            color="#dbeafe"
            label="Dagens dato"
          />

          <span>
            Klikk på en tom rute = ny reservasjon
          </span>
        </div>

        <div
          style={{
            overflowX: "auto",
            border:
              "1px solid #dbe4df",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              minWidth:
                `${
                  180 +
                  daysInMonth * 46
                }px`,
            }}
          >
            <CalendarHeader
              year={year}
              monthIndex={monthIndex}
              daysInMonth={daysInMonth}
              today={today}
            />

            {placeList.map(
              (place) => {
                const placeReservations =
                  reservationList.filter(
                    (
                      reservation
                    ) =>
                      reservation.place_id ===
                      place.id
                  );

                return (
                  <CalendarRow
                    key={place.id}
                    place={place}
                    reservations={
                      placeReservations
                    }
                    year={year}
                    monthIndex={monthIndex}
                    daysInMonth={daysInMonth}
                    today={today}
                  />
                );
              }
            )}
          </div>
        </div>

        {placeList.length === 0 && (
          <div style={emptyStyle}>
            Ingen aktive plasser i denne kategorien.
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarHeader({
  year,
  monthIndex,
  daysInMonth,
  today,
}: {
  year: number;
  monthIndex: number;
  daysInMonth: number;
  today: string;
}) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          `180px repeat(${daysInMonth}, minmax(46px, 1fr))`,

        borderBottom:
          "2px solid #dbe4df",

        background:
          "#f7faf8",
      }}
    >
      <div
        style={{
          ...headerCellStyle,
          position: "sticky",
          left: 0,
          zIndex: 5,
          background:
            "#f7faf8",
          textAlign: "left",
        }}
      >
        Plass
      </div>

      {Array.from(
        {
          length: daysInMonth,
        },
        (_, index) => {
          const day =
            index + 1;

          const date =
            new Date(
              year,
              monthIndex,
              day
            );

          const iso =
            formatIsoDate(
              date
            );

          const weekend =
            date.getDay() === 0 ||
            date.getDay() === 6;

          const isToday =
            iso === today;

          return (
            <div
              key={day}
              style={{
                ...headerCellStyle,

                background:
                  isToday
                    ? "#dbeafe"
                    : weekend
                    ? "#f0f2f1"
                    : "#f7faf8",

                color:
                  isToday
                    ? "#234d78"
                    : "#59645f",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  textTransform:
                    "uppercase",
                }}
              >
                {date.toLocaleDateString(
                  "nb-NO",
                  {
                    weekday:
                      "short",
                  }
                )}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  marginTop: "2px",
                }}
              >
                {day}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function CalendarRow({
  place,
  reservations,
  year,
  monthIndex,
  daysInMonth,
  today,
}: {
  place: any;
  reservations: any[];
  year: number;
  monthIndex: number;
  daysInMonth: number;
  today: string;
}) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          `180px repeat(${daysInMonth}, minmax(46px, 1fr))`,

        minHeight: "54px",

        position: "relative",

        borderBottom:
          "1px solid #e4e9e6",
      }}
    >
      <div
        style={{
          gridColumn: "1",
          gridRow: "1",
          position: "sticky",
          left: 0,
          zIndex: 6,
          background: "white",
          padding: "9px 10px",
          borderRight:
            "1px solid #dbe4df",
        }}
      >
        <div
          style={{
            fontWeight: "800",
            fontSize: "13px",
          }}
        >
          {place.name}
        </div>

        <div
          style={{
            fontSize: "10px",
            color: "#6b7a72",
            marginTop: "2px",
          }}
        >
          {place.has_power
            ? "Strøm"
            : "Uten strøm"}
        </div>
      </div>

      {Array.from(
        {
          length: daysInMonth,
        },
        (_, index) => {
          const day =
            index + 1;

          const date =
            new Date(
              year,
              monthIndex,
              day
            );

          const iso =
            formatIsoDate(
              date
            );

          const weekend =
            date.getDay() === 0 ||
            date.getDay() === 6;

          const isToday =
            iso === today;

          const occupied =
            reservations.some(
              (
                reservation
              ) =>
                iso >=
                  reservation.arrival_date &&
                iso <
                  reservation.departure_date
            );

          const cellBackground =
            isToday
              ? "#f3f8ff"
              : weekend
              ? "#fafafa"
              : "white";

          if (occupied) {
            return (
              <div
                key={day}
                style={{
                  gridColumn:
                    index + 2,

                  gridRow: "1",

                  minHeight: "54px",

                  borderRight:
                    "1px solid #edf0ee",

                  background:
                    cellBackground,
                }}
              />
            );
          }

          return (
            <Link
              key={day}
              prefetch={false}
              href={newReservationUrl(
                place.id,
                iso,
                stayTypeForPlace(
                  place.place_type
                )
              )}
              title={`Ny reservasjon – ${place.name} – ${formatDisplayDate(
                iso
              )}`}
              style={{
                gridColumn:
                  index + 2,

                gridRow: "1",

                minHeight:
                  "54px",

                borderRight:
                  "1px solid #edf0ee",

                background:
                  cellBackground,

                textDecoration:
                  "none",

                display:
                  "block",

                position:
                  "relative",

                zIndex: 1,

                cursor:
                  "pointer",
              }}
            >
              <span
                style={{
                  position:
                    "absolute",

                  inset:
                    "4px",

                  borderRadius:
                    "6px",

                  transition:
                    "background 0.15s ease",
                }}
              />
            </Link>
          );
        }
      )}

      {reservations.map(
        (reservation) => {
          const range =
            visibleRange(
              reservation.arrival_date,
              reservation.departure_date,
              year,
              monthIndex,
              daysInMonth
            );

          if (!range) {
            return null;
          }

          const payment =
            paymentAppearance(
              reservation
            );

          const guest =
            reservation.guests;

          const people =
            Number(
              reservation.adults || 0
            ) +
            Number(
              reservation.children || 0
            );

          const title =
            guest
              ? `${guest.first_name} ${guest.last_name}`
              : `Booking #${reservation.booking_number}`;

          const tooltip =
            `${title} • ${people} personer • ` +
            `${translateType(
              reservation.stay_type
            )} • ` +
            `${formatDisplayDate(
              reservation.arrival_date
            )} – ` +
            `${formatDisplayDate(
              reservation.departure_date
            )} • ` +
            `${payment.label}`;

          return (
            <Link
              key={reservation.id}
              href={`/dashboard/reservations/${reservation.id}`}
              title={tooltip}
              style={{
                gridColumn:
                  `${
                    range.start + 2
                  } / ${
                    range.end + 2
                  }`,

                gridRow: "1",

                alignSelf:
                  "center",

                height: "36px",

                margin: "0 3px",

                padding: "0 9px",

                display: "flex",

                alignItems:
                  "center",

                borderRadius:
                  "8px",

                background:
                  payment.background,

                color:
                  payment.color,

                border:
                  `1px solid ${payment.border}`,

                textDecoration:
                  "none",

                fontSize:
                  "12px",

                fontWeight:
                  "800",

                whiteSpace:
                  "nowrap",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

                zIndex: 4,

                boxShadow:
                  reservation.stay_status ===
                  "checked_in"
                    ? "inset 0 -4px 0 #2f6f4e"
                    : undefined,

                opacity:
                  reservation.stay_status ===
                  "checked_out"
                    ? 0.65
                    : 1,
              }}
            >
              {title}
            </Link>
          );
        }
      )}
    </div>
  );
}

function newReservationUrl(
  placeId: string,
  arrival: string,
  type: string
) {
  return (
    "/dashboard/reservations/new" +
    `?place=${encodeURIComponent(
      placeId
    )}` +
    `&arrival=${encodeURIComponent(
      arrival
    )}` +
    `&type=${encodeURIComponent(
      type
    )}`
  );
}

function stayTypeForPlace(
  placeType: string
) {
  if (
    placeType === "tent"
  ) {
    return "tent";
  }

  if (
    placeType === "cabin"
  ) {
    return "cabin";
  }

  return "motorhome";
}

function CategoryTab({
  label,
  category,
  month,
  active,
  count,
}: {
  label: string;
  category: Category;
  month: string;
  active: boolean;
  count: number;
}) {
  return (
    <Link
      href={calendarUrl(
        month,
        category
      )}
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap: "8px",

        padding:
          "10px 14px",

        borderRadius:
          "10px",

        textDecoration:
          "none",

        fontWeight:
          "800",

        border:
          active
            ? "1px solid #2f6f4e"
            : "1px solid #dbe4df",

        background:
          active
            ? "#2f6f4e"
            : "white",

        color:
          active
            ? "white"
            : "#1d2a24",
      }}
    >
      {label}

      <span
        style={{
          minWidth:
            "23px",

          height:
            "23px",

          display:
            "inline-grid",

          placeItems:
            "center",

          borderRadius:
            "999px",

          fontSize:
            "11px",

          background:
            active
              ? "rgba(255,255,255,.18)"
              : "#edf1ef",
        }}
      >
        {count}
      </span>
    </Link>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap:
          "6px",
      }}
    >
      <span
        style={{
          width:
            "12px",

          height:
            "12px",

          borderRadius:
            "999px",

          background:
            color,

          border:
            "1px solid rgba(0,0,0,.08)",
        }}
      />

      {label}
    </span>
  );
}

function visibleRange(
  arrival: string,
  departure: string,
  year: number,
  monthIndex: number,
  daysInMonth: number
) {
  const start =
    new Date(
      `${arrival}T00:00:00`
    );

  const end =
    new Date(
      `${departure}T00:00:00`
    );

  const monthStart =
    new Date(
      year,
      monthIndex,
      1
    );

  const monthEnd =
    new Date(
      year,
      monthIndex,
      daysInMonth + 1
    );

  const visibleStart =
    start < monthStart
      ? monthStart
      : start;

  const visibleEnd =
    end > monthEnd
      ? monthEnd
      : end;

  if (
    visibleEnd <=
    visibleStart
  ) {
    return null;
  }

  const startDay =
    Math.floor(
      (
        visibleStart.getTime() -
        monthStart.getTime()
      ) /
        86400000
    );

  const endDay =
    Math.floor(
      (
        visibleEnd.getTime() -
        monthStart.getTime()
      ) /
        86400000
    );

  return {
    start: startDay,
    end: endDay,
  };
}

function paymentAppearance(
  reservation: any
) {
  const paid =
    (
      reservation.payments ??
      []
    ).reduce(
      (
        sum: number,
        payment: any
      ) =>
        sum +
        Number(
          payment.amount || 0
        ),

      0
    );

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

  if (paid <= 0) {
    return {
      label:
        "Ikke betalt",

      background:
        "#f7dddd",

      border:
        "#edbebe",

      color:
        "#812d2d",
    };
  }

  if (paid < total) {
    return {
      label:
        "Delvis betalt",

      background:
        "#fff0c9",

      border:
        "#ecd899",

      color:
        "#805b08",
    };
  }

  return {
    label:
      "Betalt",

    background:
      "#dff1e7",

    border:
      "#bfdcc9",

    color:
      "#235b3d",
  };
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

function translateType(
  type: string
) {
  const map: Record<
    string,
    string
  > = {
    motorhome:
      "Bobil",

    caravan:
      "Campingvogn",

    tent:
      "Telt",

    cabin:
      "Hytte",
  };

  return map[type] ?? type;
}

function formatDisplayDate(
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
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

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
  const [year, monthNumber] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber - 1 + amount,
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

function calendarUrl(
  month: string,
  category: Category
) {
  return (
    `/dashboard/calendar?month=` +
    `${month}&category=${category}`
  );
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

const calendarToolbarStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "1fr auto 1fr",
  alignItems:
    "center",
  gap:
    "15px",
  marginBottom:
    "18px",
};

const tabsStyle = {
  display:
    "flex",
  gap:
    "8px",
  flexWrap:
    "wrap" as const,
  borderBottom:
    "1px solid #dbe4df",
  paddingBottom:
    "12px",
  marginBottom:
    "12px",
};

const legendStyle = {
  display:
    "flex",
  gap:
    "18px",
  flexWrap:
    "wrap" as const,
  alignItems:
    "center",
  color:
    "#6b7a72",
  fontSize:
    "12px",
  padding:
    "8px 0 14px",
};

const headerCellStyle = {
  padding:
    "7px 4px",
  textAlign:
    "center" as const,
  borderRight:
    "1px solid #e3e8e5",
};

const primaryButtonStyle = {
  display:
    "inline-block",
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
  display:
    "inline-block",
  background:
    "#e7efeb",
  color:
    "#1d2a24",
  padding:
    "9px 12px",
  borderRadius:
    "9px",
  textDecoration:
    "none",
  fontWeight:
    "700",
};

const todayLinkStyle = {
  display:
    "inline-block",
  marginTop:
    "4px",
  fontSize:
    "11px",
  color:
    "#2f6f4e",
  fontWeight:
    "700",
  textDecoration:
    "none",
};

const emptyStyle = {
  padding:
    "30px",
  color:
    "#6b7a72",
  textAlign:
    "center" as const,
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