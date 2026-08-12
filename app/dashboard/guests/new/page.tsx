import Link from "next/link";
import { createGuest } from "./actions";

export default async function NewGuestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "25px" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "800",
            marginBottom: "5px",
          }}
        >
          Ny gjest
        </h1>

        <p style={{ color: "#6b7a72" }}>
          Registrer en ny gjest i systemet
        </p>
      </div>

      {params.error && (
        <div
          style={{
            background: "#f8dddd",
            color: "#812d2d",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          {params.error}
        </div>
      )}

      <form
        action={createGuest}
        style={{
          background: "white",
          border: "1px solid #dbe4df",
          borderRadius: "14px",
          padding: "22px",
        }}
      >
        <div style={gridStyle}>
          <Field label="Fornavn" name="first_name" required />
          <Field label="Etternavn" name="last_name" required />

          <Field
            label="Telefon"
            name="phone"
            type="tel"
          />

          <Field
            label="E-post"
            name="email"
            type="email"
          />

          <Field
            label="Land"
            name="country"
            defaultValue="Norge"
          />

          <Field
            label="Registreringsnummer"
            name="vehicle_reg"
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "24px",
          }}
        >
          <Link
            href="/dashboard/guests"
            style={{
              padding: "10px 14px",
              borderRadius: "9px",
              background: "#e7efeb",
              color: "#1d2a24",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Avbryt
          </Link>

          <button
            type="submit"
            style={{
              border: "none",
              padding: "10px 16px",
              borderRadius: "9px",
              background: "#2f6f4e",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Lagre gjest
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontWeight: "700",
        fontSize: "13px",
      }}
    >
      {label}

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        style={{
          padding: "10px",
          border: "1px solid #cfd9d4",
          borderRadius: "9px",
          fontSize: "15px",
        }}
      />
    </label>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};