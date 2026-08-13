import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import {
  addPayment,
  updateReservationNotes,
  updateReservationStatus,
} from "./actions";

export const instant = false;

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  country: string | null;
  vehicle_reg: string | null;
};

type Place = {
  id: string;
  code: string;
  name: string;
  place_type: string;
  has_power: boolean;
};

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: reservation,
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
      notes,
      created_at,

      guests (
        id,
        first_name,
        last_name,
        phone,
        email,
        country,
        vehicle_reg
      ),

      places (
        id,
        code,
        name,
        place_type,
        has_power
      ),

      payments (
        id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error || !reservation) {
    return (
      <div>
        <h1>
          Reservasjon ikke funnet
        </h1>

        <Link href="/dashboard/reservations">
          ← Tilbake til reservasjoner
        </Link>
      </div>
    );
  }

  const guestRelation =
    reservation.guests;

  const guest: Guest | null =
    Array.isArray(guestRelation)
      ? (guestRelation[0] as Guest | undefined) ?? null
      : (guestRelation as Guest | null);

  const placeRelation =
    reservation.places;

  const place: Place | null =
    Array.isArray(placeRelation)
      ? (placeRelation[0] as Place | undefined) ?? null
      : (placeRelation as Place | null);

  const payments =
    reservation.payments ?? [];

  const nights =
    calculateNights(
      reservation.arrival_date,
      reservation.departure_date
    );

  const totalPrice =
    nights *
    Number(
      reservation.price_per_night || 0
    );

  const totalPaid =
    payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  const remaining =
    Math.max(
      0,
      totalPrice - totalPaid
    );

  const people =
    Number(
      reservation.adults || 0
    ) +
    Number(
      reservation.children || 0
    );

  const paymentStatus =
    totalPaid <= 0
      ? "Ikke betalt"
      : totalPaid < totalPrice
      ? "Delvis betalt"
      : "Betalt";

  return (
    <div>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>
            Reservasjon
          </div>

          <h1 style={titleStyle}>
            #{reservation.booking_number}
          </h1>

          {guest && (
            <div style={guestTitleStyle}>
              {guest.first_name}{" "}
              {guest.last_name}
            </div>
          )}
        </div>

        <div style={topButtonsStyle}>
          <Link
            href={`/dashboard/reservations/${reservation.id}/edit`}
            style={editButtonStyle}
          >
            Rediger reservasjon
          </Link>

          <Link
            href="/dashboard/reservations"
            style={secondaryLinkStyle}
          >
            ← Tilbake
          </Link>
        </div>
      </div>

      {query.updated && (
        <div style={successStyle}>
          Endringene i reservasjonen er lagret.
        </div>
      )}

      {query.error && (
        <div style={errorStyle}>
          ⚠ {query.error}
        </div>
      )}

      {/* HURTIG STATUS */}

      <div style={quickStatusCardStyle}>
        <div>
          <div style={quickStatusTitleStyle}>
            Dagens drift
          </div>

          <div style={quickStatusSubtitleStyle}>
            Gjeldende status:{" "}
            <StatusBadge
              status={
                reservation.stay_status
              }
            />
          </div>
        </div>

        <div style={quickActionStyle}>
          {reservation.stay_status ===
            "reserved" && (
            <form
              action={
                updateReservationStatus
              }
            >
              <input
                type="hidden"
                name="reservation_id"
                value={reservation.id}
              />

              <input
                type="hidden"
                name="stay_status"
                value="checked_in"
              />

              <button
                type="submit"
                style={checkInButtonStyle}
              >
                ✓ Sjekk inn
              </button>
            </form>
          )}

          {reservation.stay_status ===
            "checked_in" && (
            <form
              action={
                updateReservationStatus
              }
            >
              <input
                type="hidden"
                name="reservation_id"
                value={reservation.id}
              />

              <input
                type="hidden"
                name="stay_status"
                value="checked_out"
              />

              <button
                type="submit"
                style={checkOutButtonStyle}
              >
                ✓ Sjekk ut
              </button>
            </form>
          )}

          {reservation.stay_status ===
            "checked_out" && (
            <div style={finishedBadgeStyle}>
              ✓ Opphold avsluttet
            </div>
          )}

          {reservation.stay_status ===
            "no_show" && (
            <div style={noShowBadgeStyle}>
              Ikke møtt
            </div>
          )}

          {reservation.stay_status ===
            "cancelled" && (
            <div style={cancelledBadgeStyle}>
              Avbestilt
            </div>
          )}
        </div>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          title="Antall netter"
          value={nights}
        />

        <StatCard
          title="Personer"
          value={people}
        />

        <StatCard
          title="Totalpris"
          value={`${totalPrice.toLocaleString(
            "nb-NO"
          )} kr`}
        />

        <StatCard
          title="Gjenstår"
          value={`${remaining.toLocaleString(
            "nb-NO"
          )} kr`}
        />
      </div>

      <div style={twoColumnStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Opphold
          </h2>

          <InfoRow
            label="Ankomst"
            value={formatDate(
              reservation.arrival_date
            )}
          />

          <InfoRow
            label="Avreise"
            value={formatDate(
              reservation.departure_date
            )}
          />

          <InfoRow
            label="Type"
            value={translateType(
              reservation.stay_type
            )}
          />

          <InfoRow
            label="Plass"
            value={place?.name || "–"}
          />

          <InfoRow
            label="Strøm"
            value={
              place?.has_power
                ? "Ja"
                : "Nei"
            }
          />

          <InfoRow
            label="Voksne"
            value={String(
              reservation.adults
            )}
          />

          <InfoRow
            label="Barn"
            value={String(
              reservation.children
            )}
          />

          <InfoRow
            label="Pris per natt"
            value={`${Number(
              reservation.price_per_night
            ).toLocaleString(
              "nb-NO"
            )} kr`}
          />
        </div>

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Gjest
          </h2>

          {guest ? (
            <>
              <InfoRow
                label="Navn"
                value={`${guest.first_name} ${guest.last_name}`}
              />

              <InfoRow
                label="Telefon"
                value={
                  guest.phone || "–"
                }
              />

              <InfoRow
                label="E-post"
                value={
                  guest.email || "–"
                }
              />

              <InfoRow
                label="Land"
                value={
                  guest.country || "–"
                }
              />

              <InfoRow
                label="Bilnummer"
                value={
                  guest.vehicle_reg ||
                  "–"
                }
              />

              <Link
                href={`/dashboard/guests/${guest.id}`}
                style={textLinkStyle}
              >
                Åpne gjestekort →
              </Link>
            </>
          ) : (
            <p>
              Ingen gjest funnet.
            </p>
          )}
        </div>
      </div>

      <div style={twoColumnStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Reservasjonsstatus
          </h2>

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <StatusBadge
              status={
                reservation.stay_status
              }
            />
          </div>

          <div style={advancedStatusStyle}>
            <div style={advancedTitleStyle}>
              Andre statusvalg
            </div>

            <div style={advancedTextStyle}>
              Bruk dette ved for eksempel
              avbestilling eller ikke møtt.
            </div>
          </div>

          <form
            action={
              updateReservationStatus
            }
          >
            <input
              type="hidden"
              name="reservation_id"
              value={reservation.id}
            />

            <label style={labelStyle}>
              Endre status

              <select
                name="stay_status"
                defaultValue={
                  reservation.stay_status
                }
                style={inputStyle}
              >
                <option value="reserved">
                  Reservert
                </option>

                <option value="checked_in">
                  Innsjekket
                </option>

                <option value="checked_out">
                  Utsjekket
                </option>

                <option value="no_show">
                  Ikke møtt
                </option>

                <option value="cancelled">
                  Avbestilt
                </option>
              </select>
            </label>

            <button
              type="submit"
              style={greenButtonStyle}
            >
              Lagre status
            </button>
          </form>
        </div>

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Betaling
          </h2>

          <InfoRow
            label="Totalpris"
            value={`${totalPrice.toLocaleString(
              "nb-NO"
            )} kr`}
          />

          <InfoRow
            label="Betalt"
            value={`${totalPaid.toLocaleString(
              "nb-NO"
            )} kr`}
          />

          <InfoRow
            label="Gjenstår"
            value={`${remaining.toLocaleString(
              "nb-NO"
            )} kr`}
          />

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <PaymentBadge
              status={paymentStatus}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
        }}
      >
        <h2 style={headingStyle}>
          Registrer betaling
        </h2>

        <form action={addPayment}>
          <input
            type="hidden"
            name="reservation_id"
            value={reservation.id}
          />

          <div style={paymentGridStyle}>
            <label style={labelStyle}>
              Beløp

              <input
                name="amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Betalingsdato

              <input
                name="payment_date"
                type="date"
                defaultValue={
                  new Date()
                    .toISOString()
                    .slice(0, 10)
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Betalingsmåte

              <select
                name="payment_method"
                style={inputStyle}
              >
                <option value="card">
                  Kort
                </option>

                <option value="cash">
                  Kontant
                </option>

                <option value="vipps">
                  Vipps
                </option>

                <option value="bank">
                  Bank
                </option>

                <option value="online">
                  Online
                </option>

                <option value="other">
                  Annet
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Referanse

              <input
                name="reference"
                type="text"
                placeholder="Valgfritt"
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              ...labelStyle,
              marginTop: "15px",
            }}
          >
            Kommentar til betaling

            <textarea
              name="payment_notes"
              placeholder="Valgfritt"
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </label>

          <button
            type="submit"
            style={greenButtonStyle}
          >
            + Registrer betaling
          </button>
        </form>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
        }}
      >
        <h2 style={headingStyle}>
          Betalingshistorikk
        </h2>

        {payments.length === 0 ? (
          <p
            style={{
              color: "#6b7a72",
            }}
          >
            Ingen betalinger registrert ennå.
          </p>
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
                    Beløp
                  </th>

                  <th style={headerStyle}>
                    Betalingsmåte
                  </th>

                  <th style={headerStyle}>
                    Referanse
                  </th>

                  <th style={headerStyle}>
                    Kommentar
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...payments]
                  .sort(
                    (a, b) =>
                      b.payment_date.localeCompare(
                        a.payment_date
                      )
                  )
                  .map((payment) => (
                    <tr
                      key={payment.id}
                    >
                      <td style={cellStyle}>
                        {formatDate(
                          payment.payment_date
                        )}
                      </td>

                      <td style={cellStyle}>
                        {Number(
                          payment.amount
                        ).toLocaleString(
                          "nb-NO"
                        )}{" "}
                        kr
                      </td>

                      <td style={cellStyle}>
                        {translatePaymentMethod(
                          payment.payment_method
                        )}
                      </td>

                      <td style={cellStyle}>
                        {payment.reference ||
                          "–"}
                      </td>

                      <td style={cellStyle}>
                        {payment.notes || "–"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>
          Kommentar til reservasjonen
        </h2>

        <form
          action={
            updateReservationNotes
          }
        >
          <input
            type="hidden"
            name="reservation_id"
            value={reservation.id}
          />

          <textarea
            name="notes"
            defaultValue={
              reservation.notes || ""
            }
            placeholder="Skriv interne kommentarer til reservasjonen..."
            style={{
              ...inputStyle,
              minHeight: "100px",
            }}
          />

          <button
            type="submit"
            style={greenButtonStyle}
          >
            Lagre kommentar
          </button>
        </form>
      </div>
    </div>
  );
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

function translateType(
  type: string
) {
  const map: Record<
    string,
    string
  > = {
    motorhome: "Bobil",
    caravan: "Campingvogn",
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoRowStyle}>
      <strong style={infoLabelStyle}>
        {label}
      </strong>

      <span>
        {value}
      </span>
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
        padding: "6px 10px",
        borderRadius: "999px",
        background:
          value.background,
        color:
          value.color,
        fontWeight: "700",
        fontSize: "12px",
      }}
    >
      {value.label}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status: string;
}) {
  const values =
    status === "Betalt"
      ? {
          background: "#dff1e7",
          color: "#235b3d",
        }
      : status === "Delvis betalt"
      ? {
          background: "#fff0c9",
          color: "#805b08",
        }
      : {
          background: "#f7dddd",
          color: "#812d2d",
        };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "999px",
        fontWeight: "700",
        fontSize: "12px",
        ...values,
      }}
    >
      {status}
    </span>
  );
}

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "25px",
};

const topButtonsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  color: "#6b7a72",
  fontSize: "13px",
  marginBottom: "5px",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "800",
};

const guestTitleStyle = {
  marginTop: "5px",
  fontSize: "18px",
};

const quickStatusCardStyle = {
  background: "white",
  border: "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
};

const quickStatusTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
};

const quickStatusSubtitleStyle = {
  color: "#6b7a72",
  fontSize: "13px",
  marginTop: "7px",
};

const quickActionStyle = {
  display: "flex",
  gap: "10px",
};

const checkInButtonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "14px 22px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const checkOutButtonStyle = {
  border: "none",
  background: "#315f87",
  color: "white",
  padding: "14px 22px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "800",
  cursor: "pointer",
};

const finishedBadgeStyle = {
  background: "#e7efeb",
  color: "#315944",
  padding: "12px 16px",
  borderRadius: "10px",
  fontWeight: "800",
};

const noShowBadgeStyle = {
  background: "#fff0c9",
  color: "#805b08",
  padding: "12px 16px",
  borderRadius: "10px",
  fontWeight: "800",
};

const cancelledBadgeStyle = {
  background: "#f7dddd",
  color: "#812d2d",
  padding: "12px 16px",
  borderRadius: "10px",
  fontWeight: "800",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #dbe4df",
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

const headingStyle = {
  fontSize: "20px",
  fontWeight: "700",
  marginBottom: "15px",
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "150px 1fr",
  gap: "10px",
  padding: "10px 0",
  borderBottom:
    "1px solid #e5ebe8",
};

const infoLabelStyle = {
  color: "#6b7a72",
};

const advancedStatusStyle = {
  background: "#f7faf8",
  borderRadius: "9px",
  padding: "10px",
  marginBottom: "15px",
};

const advancedTitleStyle = {
  fontWeight: "700",
  fontSize: "13px",
};

const advancedTextStyle = {
  color: "#6b7a72",
  fontSize: "11px",
  marginTop: "3px",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  fontSize: "13px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #cfd9d4",
  borderRadius: "9px",
  fontSize: "15px",
};

const paymentGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: "15px",
};

const greenButtonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "10px 14px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "15px",
};

const editButtonStyle = {
  display: "inline-block",
  background: "#2f6f4e",
  color: "white",
  padding: "10px 14px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const secondaryLinkStyle = {
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "10px 14px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const textLinkStyle = {
  display: "inline-block",
  marginTop: "15px",
  color: "#2f6f4e",
  fontWeight: "700",
  textDecoration: "none",
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse" as const,
};

const headerStyle = {
  textAlign: "left" as const,
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

const successStyle = {
  background: "#dff1e7",
  color: "#235b3d",
  padding: "13px",
  borderRadius: "10px",
  marginBottom: "15px",
};

const errorStyle = {
  background: "#f8dddd",
  color: "#812d2d",
  padding: "13px",
  borderRadius: "10px",
  marginBottom: "15px",
};