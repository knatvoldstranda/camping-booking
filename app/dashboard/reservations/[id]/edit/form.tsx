"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  updateReservation,
} from "./actions";

type Reservation = {
  id: string;
  booking_number: string | number;
  place_id: string;
  arrival_date: string;
  departure_date: string;
  stay_type: string;
  adults: number;
  children: number;
  price_per_night: number;
  notes: string | null;
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

export default function EditReservationForm({
  reservation,
  places,
  error,
}: {
  reservation: Reservation;
  places: Place[];
  error?: string;
}) {
  const [
    stayType,
    setStayType,
  ] = useState(
    reservation.stay_type
  );

  const [
    placeId,
    setPlaceId,
  ] = useState(
    reservation.place_id
  );

  const [
    arrival,
    setArrival,
  ] = useState(
    reservation.arrival_date
  );

  const [
    departure,
    setDeparture,
  ] = useState(
    reservation.departure_date
  );

  const [
    pricePerNight,
    setPricePerNight,
  ] = useState(
    Number(
      reservation.price_per_night ||
        0
    )
  );

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

    const matches =
      newType ===
        "motorhome" ||
      newType === "caravan"
        ? selectedPlace.place_type ===
          "motorhome_caravan"
        : newType === "tent"
        ? selectedPlace.place_type ===
          "tent"
        : selectedPlace.place_type ===
          "cabin";

    if (!matches) {
      setPlaceId("");
    }
  }

  return (
    <div
      style={{
        maxWidth: "950px",
      }}
    >
      {error && (
        <div style={errorStyle}>
          ⚠ {error}
        </div>
      )}

      <form
        action={
          updateReservation
        }
        style={cardStyle}
      >
        <input
          type="hidden"
          name="reservation_id"
          value={reservation.id}
        />

        <div style={gridStyle}>
          <FieldWrapper label="Type opphold">
            <select
              name="stay_type"
              value={stayType}
              onChange={(event) =>
                changeStayType(
                  event.target.value
                )
              }
              style={inputStyle}
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
              value={placeId}
              onChange={(event) =>
                setPlaceId(
                  event.target.value
                )
              }
              required
              style={inputStyle}
            >
              <option value="">
                Velg plass
              </option>

              {filteredPlaces.map(
                (place) => (
                  <option
                    key={place.id}
                    value={place.id}
                  >
                    {place.name}
                  </option>
                )
              )}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Ankomst">
            <input
              name="arrival_date"
              type="date"
              value={arrival}
              onChange={(event) => {
                const value =
                  event.target.value;

                setArrival(value);

                if (
                  value &&
                  (!departure ||
                    departure <= value)
                ) {
                  setDeparture(
                    addDays(
                      value,
                      1
                    )
                  );
                }
              }}
              required
              style={inputStyle}
            />
          </FieldWrapper>

          <FieldWrapper label="Avreise">
            <input
              name="departure_date"
              type="date"
              value={departure}
              onChange={(event) =>
                setDeparture(
                  event.target.value
                )
              }
              required
              style={inputStyle}
            />
          </FieldWrapper>

          <FieldWrapper label="Voksne">
            <input
              name="adults"
              type="number"
              min="0"
              defaultValue={
                reservation.adults
              }
              required
              style={inputStyle}
            />
          </FieldWrapper>

          <FieldWrapper label="Barn">
            <input
              name="children"
              type="number"
              min="0"
              defaultValue={
                reservation.children
              }
              required
              style={inputStyle}
            />
          </FieldWrapper>

          <FieldWrapper label="Pris per natt">
            <input
              name="price_per_night"
              type="number"
              min="0"
              step="1"
              value={pricePerNight}
              onChange={(event) =>
                setPricePerNight(
                  Number(
                    event.target.value
                  )
                )
              }
              required
              style={inputStyle}
            />
          </FieldWrapper>

          <div style={summaryCardStyle}>
            <div style={smallTextStyle}>
              Ny beregning
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "800",
                marginTop: "4px",
              }}
            >
              {nights} netter
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: "800",
                marginTop: "3px",
                color: "#235b3d",
              }}
            >
              {totalPrice.toLocaleString(
                "nb-NO"
              )}{" "}
              kr
            </div>
          </div>

          <FieldWrapper
            label="Kommentar"
            full
          >
            <textarea
              name="notes"
              defaultValue={
                reservation.notes || ""
              }
              style={{
                ...inputStyle,
                minHeight: "100px",
              }}
            />
          </FieldWrapper>
        </div>

        <div style={warningStyle}>
          <strong>
            Dobbeltbooking kontrolleres automatisk
          </strong>

          <div
            style={{
              marginTop: "4px",
            }}
          >
            Hvis plassen allerede er opptatt i den nye
            perioden, vil systemet nekte å lagre.
          </div>
        </div>

        <div style={buttonRowStyle}>
          <Link
            href={`/dashboard/reservations/${reservation.id}`}
            style={secondaryButtonStyle}
          >
            Avbryt
          </Link>

          <button
            type="submit"
            style={primaryButtonStyle}
          >
            Lagre endringer
          </button>
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
    date.getDate() + days
  );

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
        display: "flex",
        flexDirection:
          "column",
        gap: "6px",
        fontSize: "13px",
        fontWeight: "700",
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

const cardStyle = {
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "22px",
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
  background: "white",
};

const summaryCardStyle = {
  background: "#f7faf8",
  border:
    "1px solid #dbe4df",
  borderRadius: "10px",
  padding: "12px",
};

const smallTextStyle = {
  fontSize: "12px",
  color: "#6b7a72",
};

const warningStyle = {
  marginTop: "20px",
  background: "#fff2c7",
  color: "#725600",
  padding: "12px",
  borderRadius: "10px",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent:
    "flex-end",
  gap: "10px",
  marginTop: "20px",
};

const primaryButtonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "11px 16px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
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