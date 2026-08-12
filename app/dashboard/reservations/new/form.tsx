"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  createReservation,
} from "./actions";

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  vehicle_reg: string | null;
  important_message: string | null;
  blocked: boolean;
  blocked_reason: string | null;
};

type Place = {
  id: string;
  code: string;
  name: string;
  place_type: string;
  capacity: number;
  has_power: boolean;
  active: boolean;
};

export default function ReservationForm({
  guests,
  places,
  error,
  initialPlaceId = "",
  initialStayType = "motorhome",
  initialArrival = "",
}: {
  guests: Guest[];
  places: Place[];
  error?: string;
  initialPlaceId?: string;
  initialStayType?: string;
  initialArrival?: string;
}) {
  const [guestMode, setGuestMode] =
    useState<
      "existing" | "new"
    >("existing");

  const [guestId, setGuestId] =
    useState("");

  const [stayType, setStayType] =
    useState(
      initialStayType
    );

  const [placeId, setPlaceId] =
    useState(
      initialPlaceId
    );

  const [arrival, setArrival] =
    useState(
      initialArrival
    );

  const [departure, setDeparture] =
    useState(
      initialArrival
        ? addDays(
            initialArrival,
            1
          )
        : ""
    );

  const [
    pricePerNight,
    setPricePerNight,
  ] = useState(450);

  const selectedGuest =
    guests.find(
      (guest) =>
        guest.id === guestId
    ) ?? null;

  const filteredPlaces =
    useMemo(() => {
      if (
        stayType ===
          "motorhome" ||
        stayType ===
          "caravan"
      ) {
        return places.filter(
          (place) =>
            place.place_type ===
            "motorhome_caravan"
        );
      }

      if (
        stayType === "tent"
      ) {
        return places.filter(
          (place) =>
            place.place_type ===
            "tent"
        );
      }

      if (
        stayType === "cabin"
      ) {
        return places.filter(
          (place) =>
            place.place_type ===
            "cabin"
        );
      }

      return places;
    }, [
      places,
      stayType,
    ]);

  const nights =
    useMemo(() => {
      if (
        !arrival ||
        !departure
      ) {
        return 0;
      }

      const start =
        new Date(
          `${arrival}T00:00:00`
        );

      const end =
        new Date(
          `${departure}T00:00:00`
        );

      const difference =
        end.getTime() -
        start.getTime();

      if (
        difference <= 0
      ) {
        return 0;
      }

      return Math.round(
        difference /
          86400000
      );
    }, [
      arrival,
      departure,
    ]);

  const totalPrice =
    nights *
    pricePerNight;

  function changeStayType(
    newType: string
  ) {
    setStayType(newType);

    const selectedPlace =
      places.find(
        (place) =>
          place.id ===
          placeId
      );

    if (!selectedPlace) {
      setPlaceId("");
      return;
    }

    const valid =
      (newType ===
        "motorhome" ||
        newType ===
          "caravan")
        ? selectedPlace.place_type ===
          "motorhome_caravan"
        : newType ===
          "tent"
        ? selectedPlace.place_type ===
          "tent"
        : selectedPlace.place_type ===
          "cabin";

    if (!valid) {
      setPlaceId("");
    }
  }

  return (
    <div
      style={{
        maxWidth:
          "950px",
      }}
    >
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            Ny reservasjon
          </h1>

          <p
            style={{
              color:
                "#6b7a72",
            }}
          >
            Opprett gjest og
            reservasjon i samme
            skjema
          </p>
        </div>

        <Link
          href="/dashboard/calendar"
          style={
            cancelLinkStyle
          }
        >
          ← Tilbake
        </Link>
      </div>

      {initialPlaceId &&
        initialArrival && (
          <div style={calendarInfoStyle}>
            <strong>
              Opprettet fra kalender
            </strong>

            <div
              style={{
                marginTop:
                  "4px",
              }}
            >
              Plass og
              ankomstdato er
              allerede valgt.
            </div>
          </div>
        )}

      {error && (
        <div style={errorStyle}>
          ⚠ {error}
        </div>
      )}

      <form
        action={
          createReservation
        }
      >
        <input
          type="hidden"
          name="guest_mode"
          value={guestMode}
        />

        <div
          style={{
            ...cardStyle,
            marginBottom:
              "18px",
          }}
        >
          <h2
            style={
              sectionHeadingStyle
            }
          >
            1. Gjest
          </h2>

          <div
            style={
              guestModeStyle
            }
          >
            <button
              type="button"
              onClick={() =>
                setGuestMode(
                  "existing"
                )
              }
              style={{
                ...modeButtonStyle,

                ...(guestMode ===
                "existing"
                  ? activeModeStyle
                  : {}),
              }}
            >
              Eksisterende gjest
            </button>

            <button
              type="button"
              onClick={() => {
                setGuestMode(
                  "new"
                );

                setGuestId("");
              }}
              style={{
                ...modeButtonStyle,

                ...(guestMode ===
                "new"
                  ? activeModeStyle
                  : {}),
              }}
            >
              + Ny gjest
            </button>
          </div>

          {guestMode ===
          "existing" ? (
            <>
              <FieldWrapper
                label="Velg gjest"
                full
              >
                <select
                  name="guest_id"
                  required
                  value={
                    guestId
                  }
                  onChange={(
                    event
                  ) =>
                    setGuestId(
                      event.target
                        .value
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  <option value="">
                    Velg gjest
                  </option>

                  {guests.map(
                    (guest) => (
                      <option
                        key={
                          guest.id
                        }
                        value={
                          guest.id
                        }
                      >
                        {
                          guest.last_name
                        }
                        ,{" "}
                        {
                          guest.first_name
                        }

                        {guest.blocked
                          ? " – SPERRET"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </FieldWrapper>

              {selectedGuest?.blocked && (
                <div
                  style={
                    blockedStyle
                  }
                >
                  <strong>
                    ⚠ SPERRET
                    GJEST
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "5px",
                    }}
                  >
                    Denne
                    gjesten er
                    markert som
                    ikke ønsket
                    tilbake.
                  </div>

                  {selectedGuest.blocked_reason && (
                    <div
                      style={{
                        marginTop:
                          "5px",
                      }}
                    >
                      Årsak:{" "}
                      {
                        selectedGuest.blocked_reason
                      }
                    </div>
                  )}
                </div>
              )}

              {selectedGuest?.important_message && (
                <div
                  style={
                    importantStyle
                  }
                >
                  <strong>
                    ★ Viktig
                    beskjed
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "5px",
                    }}
                  >
                    {
                      selectedGuest.important_message
                    }
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={
                guestFieldsGrid
              }
            >
              <FieldWrapper
                label="Fornavn"
              >
                <input
                  name="first_name"
                  required
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                label="Etternavn"
              >
                <input
                  name="last_name"
                  required
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                label="Telefon"
              >
                <input
                  name="phone"
                  type="tel"
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                label="E-post"
              >
                <input
                  name="email"
                  type="email"
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                label="Land"
              >
                <input
                  name="country"
                  defaultValue="Norge"
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                label="Registreringsnummer"
              >
                <input
                  name="vehicle_reg"
                  style={
                    inputStyle
                  }
                />
              </FieldWrapper>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2
            style={
              sectionHeadingStyle
            }
          >
            2. Reservasjon
          </h2>

          <div style={gridStyle}>
            <FieldWrapper
              label="Type opphold"
            >
              <select
                name="stay_type"
                value={
                  stayType
                }
                onChange={(
                  event
                ) =>
                  changeStayType(
                    event.target
                      .value
                  )
                }
                style={
                  inputStyle
                }
              >
                <option value="motorhome">
                  Bobil
                </option>

                <option value="caravan">
                  Campingvogn
                </option>

                <option value="tent">
                  Telt
                </option>

                <option value="cabin">
                  Hytte
                </option>
              </select>
            </FieldWrapper>

            <FieldWrapper label="Plass">
              <select
                name="place_id"
                required
                value={
                  placeId
                }
                onChange={(
                  event
                ) =>
                  setPlaceId(
                    event.target
                      .value
                  )
                }
                style={
                  inputStyle
                }
              >
                <option value="">
                  Velg plass
                </option>

                {filteredPlaces.map(
                  (place) => (
                    <option
                      key={
                        place.id
                      }
                      value={
                        place.id
                      }
                    >
                      {
                        place.name
                      }
                    </option>
                  )
                )}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Ankomst">
              <input
                name="arrival_date"
                type="date"
                required
                value={
                  arrival
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value;

                  setArrival(
                    value
                  );

                  if (
                    value &&
                    (!departure ||
                      departure <=
                        value)
                  ) {
                    setDeparture(
                      addDays(
                        value,
                        1
                      )
                    );
                  }
                }}
                style={
                  inputStyle
                }
              />
            </FieldWrapper>

            <FieldWrapper label="Avreise">
              <input
                name="departure_date"
                type="date"
                required
                value={
                  departure
                }
                onChange={(
                  event
                ) =>
                  setDeparture(
                    event.target
                      .value
                  )
                }
                style={
                  inputStyle
                }
              />
            </FieldWrapper>

            <FieldWrapper label="Voksne">
              <input
                name="adults"
                type="number"
                min="0"
                defaultValue="2"
                required
                style={
                  inputStyle
                }
              />
            </FieldWrapper>

            <FieldWrapper label="Barn">
              <input
                name="children"
                type="number"
                min="0"
                defaultValue="0"
                required
                style={
                  inputStyle
                }
              />
            </FieldWrapper>

            <FieldWrapper label="Pris per natt">
              <input
                name="price_per_night"
                type="number"
                min="0"
                step="1"
                value={
                  pricePerNight
                }
                onChange={(
                  event
                ) =>
                  setPricePerNight(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                required
                style={
                  inputStyle
                }
              />
            </FieldWrapper>

            <FieldWrapper label="Antall netter">
              <input
                value={nights}
                readOnly
                style={{
                  ...inputStyle,
                  background:
                    "#f2f5f3",
                }}
              />
            </FieldWrapper>

            <FieldWrapper
              label="Kommentar"
              full
            >
              <textarea
                name="notes"
                placeholder="Eventuelle kommentarer om reservasjonen..."
                style={{
                  ...inputStyle,
                  minHeight:
                    "90px",
                }}
              />
            </FieldWrapper>
          </div>

          <div
            style={
              summaryStyle
            }
          >
            <div>
              <span
                style={{
                  color:
                    "#6b7a72",
                }}
              >
                Antall netter
              </span>

              <strong>
                {nights}
              </strong>
            </div>

            <div>
              <span
                style={{
                  color:
                    "#6b7a72",
                }}
              >
                Totalpris
              </span>

              <strong>
                {totalPrice.toLocaleString(
                  "nb-NO"
                )}{" "}
                kr
              </strong>
            </div>
          </div>

          <div
            style={
              actionsStyle
            }
          >
            <Link
              href="/dashboard/calendar"
              style={
                cancelLinkStyle
              }
            >
              Avbryt
            </Link>

            <button
              type="submit"
              disabled={
                guestMode ===
                  "existing" &&
                selectedGuest?.blocked
              }
              style={{
                ...buttonStyle,

                ...(guestMode ===
                  "existing" &&
                selectedGuest?.blocked
                  ? disabledButtonStyle
                  : {}),
              }}
            >
              {guestMode ===
                "existing" &&
              selectedGuest?.blocked
                ? "Gjesten er sperret"
                : guestMode ===
                  "new"
                ? "Opprett gjest og reservasjon"
                : "Lagre reservasjon"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function addDays(
  dateString: string,
  days: number
) {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() +
      days
  );

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

function FieldWrapper({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label
      style={{
        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "6px",

        fontSize:
          "13px",

        fontWeight:
          "700",

        gridColumn:
          full
            ? "1 / -1"
            : undefined,
      }}
    >
      {label}

      {children}
    </label>
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

const cardStyle = {
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "22px",
};

const sectionHeadingStyle = {
  fontSize: "20px",
  fontWeight: "800",
  marginBottom: "16px",
};

const guestModeStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "18px",
};

const modeButtonStyle = {
  border:
    "1px solid #dbe4df",
  background: "white",
  color: "#1d2a24",
  padding: "10px 14px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const activeModeStyle = {
  background: "#2f6f4e",
  borderColor: "#2f6f4e",
  color: "white",
};

const guestFieldsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border:
    "1px solid #cfd9d4",
  borderRadius: "9px",
  fontSize: "15px",
};

const summaryStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: "15px",
  marginTop: "22px",
  padding: "15px",
  background: "#f7faf8",
  borderRadius: "10px",
};

const actionsStyle = {
  display: "flex",
  justifyContent:
    "flex-end",
  gap: "10px",
  marginTop: "20px",
};

const buttonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "11px 16px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const disabledButtonStyle = {
  background: "#999999",
  cursor: "not-allowed",
};

const cancelLinkStyle = {
  display: "inline-block",
  background: "#e7efeb",
  color: "#1d2a24",
  padding: "11px 15px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};

const errorStyle = {
  background: "#f8dddd",
  color: "#812d2d",
  padding: "13px",
  borderRadius: "10px",
  marginBottom: "15px",
};

const blockedStyle = {
  background: "#fde2e2",
  color: "#812d2d",
  border:
    "2px solid #d66565",
  padding: "14px",
  borderRadius: "10px",
  marginTop: "15px",
};

const importantStyle = {
  background: "#fff2c7",
  color: "#725600",
  border:
    "1px solid #e1c65f",
  padding: "14px",
  borderRadius: "10px",
  marginTop: "15px",
};

const calendarInfoStyle = {
  background: "#e8f2ec",
  color: "#315944",
  border:
    "1px solid #c9ded2",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "15px",
};