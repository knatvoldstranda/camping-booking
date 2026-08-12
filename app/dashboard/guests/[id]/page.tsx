import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import {
  saveGuestNote,
  saveGuestAlert,
  saveGuestRestriction,
} from "./actions";

type Place = {
  name: string;
};

export default async function GuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: guest, error } = await supabase
    .from("guests")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      country,
      vehicle_reg,
      created_at,
      reservations (
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
        places (
          name
        ),
        payments (
          amount,
          payment_date
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !guest) {
    return (
      <div>
        <h1>Gjest ikke funnet</h1>

        <Link href="/dashboard/guests">
          Tilbake til gjester
        </Link>
      </div>
    );
  }

  const { data: guestNotes } = await supabase
    .from("guest_notes")
    .select("id, note, created_at")
    .eq("guest_id", id)
    .order("created_at", {
      ascending: false,
    });

  const { data: guestAlert } = await supabase
    .from("guest_alerts")
    .select("id, enabled, message")
    .eq("guest_id", id)
    .maybeSingle();

  const { data: guestRestriction } =
    await supabase
      .from("guest_restrictions")
      .select("id, blocked, reason")
      .eq("guest_id", id)
      .maybeSingle();

  const reservations =
    guest.reservations ?? [];

  const totalNights =
    reservations.reduce(
      (sum, reservation) => {
        const arrival =
          new Date(
            `${reservation.arrival_date}T00:00:00`
          );

        const departure =
          new Date(
            `${reservation.departure_date}T00:00:00`
          );

        return (
          sum +
          Math.round(
            (
              departure.getTime() -
              arrival.getTime()
            ) /
              86400000
          )
        );
      },
      0
    );

  const totalPaid =
    reservations.reduce(
      (sum, reservation) => {
        const payments =
          reservation.payments ?? [];

        return (
          sum +
          payments.reduce(
            (
              paymentSum,
              payment
            ) =>
              paymentSum +
              Number(
                payment.amount || 0
              ),
            0
          )
        );
      },
      0
    );

  return (
    <div>
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            {guest.first_name}{" "}
            {guest.last_name}
          </h1>

          <p style={subtitleStyle}>
            Gjestekort
          </p>
        </div>

        <Link
          href="/dashboard/guests"
          style={backLinkStyle}
        >
          ← Tilbake
        </Link>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          title="Besøk"
          value={
            reservations.length
          }
        />

        <StatCard
          title="Netter"
          value={totalNights}
        />

        <StatCard
          title="Totalt betalt"
          value={`${totalPaid.toLocaleString(
            "nb-NO"
          )} kr`}
        />
      </div>

      <div style={twoColumnStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Kontaktinformasjon
          </h2>

          <InfoRow
            label="Telefon"
            value={guest.phone}
          />

          <InfoRow
            label="E-post"
            value={guest.email}
          />

          <InfoRow
            label="Land"
            value={guest.country}
          />

          <InfoRow
            label="Registreringsnummer"
            value={
              guest.vehicle_reg
            }
          />
        </div>

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Gjestestatus
          </h2>

          {guestRestriction?.blocked ? (
            <div style={blockedStyle}>
              ⚠ SPERRET GJEST

              {guestRestriction.reason && (
                <div
                  style={{
                    marginTop: "5px",
                    fontWeight: "400",
                  }}
                >
                  {
                    guestRestriction.reason
                  }
                </div>
              )}
            </div>
          ) : (
            <div style={okStyle}>
              Ingen sperre
            </div>
          )}

          {guestAlert?.enabled && (
            <div style={importantStyle}>
              <strong>
                ★ Viktig beskjed
              </strong>

              <div
                style={{
                  marginTop: "5px",
                }}
              >
                {guestAlert.message}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={twoColumnStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Viktig beskjed
          </h2>

          <form
            action={
              saveGuestAlert
            }
          >
            <input
              type="hidden"
              name="guest_id"
              value={guest.id}
            />

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={
                  guestAlert?.enabled ??
                  false
                }
              />

              Vis viktig beskjed ved nye reservasjoner
            </label>

            <textarea
              name="message"
              defaultValue={
                guestAlert?.message ??
                ""
              }
              placeholder="Eksempel: Gjesten trenger tilgang til HC-toalett."
              style={textareaStyle}
            />

            <button
              type="submit"
              style={greenButtonStyle}
            >
              Lagre viktig beskjed
            </button>
          </form>
        </div>

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            Sperre gjest
          </h2>

          <form
            action={
              saveGuestRestriction
            }
          >
            <input
              type="hidden"
              name="guest_id"
              value={guest.id}
            />

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                name="blocked"
                defaultChecked={
                  guestRestriction?.blocked ??
                  false
                }
              />

              Denne gjesten er ikke ønsket tilbake
            </label>

            <textarea
              name="reason"
              defaultValue={
                guestRestriction?.reason ??
                ""
              }
              placeholder="Intern årsak, kort og saklig."
              style={textareaStyle}
            />

            <button
              type="submit"
              style={greenButtonStyle}
            >
              Lagre sperrestatus
            </button>
          </form>
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
        }}
      >
        <h2 style={headingStyle}>
          Interne notater
        </h2>

        <form action={saveGuestNote}>
          <input
            type="hidden"
            name="guest_id"
            value={guest.id}
          />

          <textarea
            name="note"
            placeholder="Skriv et internt notat om gjesten..."
            required
            style={textareaStyle}
          />

          <button
            type="submit"
            style={greenButtonStyle}
          >
            + Legg til notat
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          {guestNotes &&
          guestNotes.length > 0 ? (
            guestNotes.map(
              (note) => (
                <div
                  key={note.id}
                  style={noteStyle}
                >
                  <div>
                    {note.note}
                  </div>

                  <div style={noteDateStyle}>
                    {new Date(
                      note.created_at
                    ).toLocaleString(
                      "nb-NO"
                    )}
                  </div>
                </div>
              )
            )
          ) : (
            <p style={mutedStyle}>
              Ingen interne notater.
            </p>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>
          Besøkshistorikk
        </h2>

        {reservations.length ===
        0 ? (
          <p style={mutedStyle}>
            Denne gjesten har ingen reservasjoner ennå.
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
                    Booking
                  </th>

                  <th style={headerStyle}>
                    Periode
                  </th>

                  <th style={headerStyle}>
                    Type
                  </th>

                  <th style={headerStyle}>
                    Plass
                  </th>

                  <th style={headerStyle}>
                    Status
                  </th>

                  <th style={headerStyle}>
                    Betalt
                  </th>
                </tr>
              </thead>

              <tbody>
                {reservations.map(
                  (reservation) => {
                    const paid =
                      reservation.payments?.reduce(
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
                      ) ?? 0;

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
                          {
                            reservation.arrival_date
                          }{" "}
                          –{" "}
                          {
                            reservation.departure_date
                          }
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
                          {place?.name ||
                            "–"}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            reservation.stay_status
                          }
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div style={infoRowStyle}>
      <strong style={infoLabelStyle}>
        {label}
      </strong>

      <span>{value || "–"}</span>
    </div>
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

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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

const backLinkStyle = {
  textDecoration: "none",
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "10px 14px",
  borderRadius: "9px",
  fontWeight: "700",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "18px",
};

const headingStyle = {
  fontSize: "20px",
  fontWeight: "700",
  marginBottom: "15px",
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

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "160px 1fr",
  gap: "10px",
  padding: "10px 0",
  borderBottom:
    "1px solid #e5ebe8",
};

const infoLabelStyle = {
  color: "#6b7a72",
};

const checkboxLabelStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  marginBottom: "12px",
  fontWeight: "700",
};

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "10px",
  border: "1px solid #cfd9d4",
  borderRadius: "9px",
};

const greenButtonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "10px 14px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "12px",
};

const blockedStyle = {
  background: "#fde2e2",
  color: "#8a2424",
  padding: "12px",
  borderRadius: "10px",
  marginBottom: "15px",
  fontWeight: "700",
};

const okStyle = {
  background: "#dff1e7",
  color: "#235b3d",
  padding: "10px",
  borderRadius: "10px",
  marginBottom: "15px",
};

const importantStyle = {
  background: "#fff2c7",
  color: "#725600",
  padding: "12px",
  borderRadius: "10px",
};

const noteStyle = {
  padding: "12px 0",
  borderBottom:
    "1px solid #e5ebe8",
};

const noteDateStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#6b7a72",
};

const mutedStyle = {
  color: "#6b7a72",
};

const reservationLinkStyle = {
  color: "#2f6f4e",
  fontWeight: "800",
  textDecoration: "none",
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