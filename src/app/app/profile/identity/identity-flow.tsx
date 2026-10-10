"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera } from "lucide-react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

/* eslint-disable @next/next/no-img-element */

// Three steps: details as written on the ID, a photo of the ID front taken with the camera, a selfie holding the ID.
// Photos go straight from the browser to the private "identity" bucket under the person's own folder; the row in
// identity_checks carries the details. Only the person and admins can read any of it.

type Details = { legal_name: string; id_type: "national_id" | "passport" | "other"; id_number: string; date_of_birth: string };

function Capture({ label, hint, facing, file, onFile }: { label: string; hint: string; facing: "environment" | "user"; file: File | null; onFile: (f: File | null) => void }) {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="card p-4">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-ink-muted">{hint}</p>
      {preview ? (
        <img src={preview} alt="" className="mt-3 max-h-72 w-full rounded-xl object-contain bg-stone-100" />
      ) : (
        <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700">
          <Camera className="size-10" />
        </div>
      )}
      <label className="mt-3 inline-block">
        <input
          type="file"
          accept="image/*"
          capture={facing}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-ink hover:bg-brand-400">
          <Camera className="size-4" /> {file ? t("Retake") : t("Take photo")}
        </span>
      </label>
    </div>
  );
}

export function IdentityFlow({ userId, defaultName }: { userId: string; defaultName: string }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [d, setD] = useState<Details>({ legal_name: defaultName, id_type: "national_id", id_number: "", date_of_birth: "" });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const detailsOk = d.legal_name.trim().length > 0 && d.id_number.trim().length >= 3 && d.date_of_birth !== "";

  const submit = async () => {
    if (!idFile || !selfie) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const stamp = Date.now();
    const ext = (f: File) => (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const idPath = `${userId}/${stamp}-id.${ext(idFile)}`;
    const selfiePath = `${userId}/${stamp}-selfie.${ext(selfie)}`;
    const up1 = await supabase.storage.from("identity").upload(idPath, idFile, { contentType: idFile.type });
    const up2 = up1.error ? null : await supabase.storage.from("identity").upload(selfiePath, selfie, { contentType: selfie.type });
    if (up1.error || !up2 || up2.error) {
      setBusy(false);
      return setError("Upload failed.");
    }
    const { error: insertError } = await supabase.from("identity_checks").insert({
      user_id: userId,
      image_path: idPath,
      selfie_path: selfiePath,
      legal_name: d.legal_name.trim(),
      id_type: d.id_type,
      id_number: d.id_number.trim(),
      date_of_birth: d.date_of_birth,
    });
    setBusy(false);
    if (insertError) return setError("Something went wrong. Please try again.");
    setDone(true);
    router.refresh();
  };

  if (done) return <Notice tone="success">{t("Submitted. A person checks it within two working days.")}</Notice>;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("Step {n} of 3", { n: step })}</p>
      {error && <Notice tone="error">{t(error)}</Notice>}

      {step === 1 && (
        <form
          className="card space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (detailsOk) setStep(2);
          }}
        >
          <p className="font-semibold">{t("Your details as written on the ID")}</p>
          <Field label={t("Legal name")}>
            <input value={d.legal_name} onChange={(e) => setD({ ...d, legal_name: e.target.value })} className={inputClass} autoComplete="name" />
          </Field>
          <Field label={t("ID type")}>
            <select value={d.id_type} onChange={(e) => setD({ ...d, id_type: e.target.value as Details["id_type"] })} className={inputClass}>
              <option value="national_id">{t("National ID card")}</option>
              <option value="passport">{t("Passport")}</option>
              <option value="other">{t("Other")}</option>
            </select>
          </Field>
          <Field label={t("ID number")}>
            <input value={d.id_number} onChange={(e) => setD({ ...d, id_number: e.target.value })} className={inputClass} inputMode="text" autoComplete="off" />
          </Field>
          <Field label={t("Date of birth")}>
            <input type="date" value={d.date_of_birth} onChange={(e) => setD({ ...d, date_of_birth: e.target.value })} className={inputClass} max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Button type="submit" disabled={!detailsOk}>
            {t("Next")}
          </Button>
        </form>
      )}

      {step === 2 && (
        <>
          <Capture label={t("Photo of the front of your ID")} hint={t("Make sure the text is readable and the whole card is in the frame.")} facing="environment" file={idFile} onFile={setIdFile} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              {t("Back")}
            </Button>
            <Button type="button" disabled={!idFile} onClick={() => setStep(3)}>
              {t("Next")}
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <Capture label={t("Selfie holding your ID next to your face")} hint={t("Make sure the text is readable and the whole card is in the frame.")} facing="user" file={selfie} onFile={setSelfie} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              {t("Back")}
            </Button>
            <Button type="button" disabled={!selfie || busy} onClick={submit}>
              {t("Submit for review")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
