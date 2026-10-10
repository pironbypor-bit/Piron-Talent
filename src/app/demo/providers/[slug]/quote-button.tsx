"use client";

import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

/** Demo only: explains what the button does in the live product instead of doing it. */
export function QuoteButton({ name }: { name: string }) {
  const t = useT();
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-3">
      <Button type="button" onClick={() => setShown(true)}>
        {t("Request a quote")}
      </Button>
      {shown && <Notice tone="info">{t("In the live product this opens the request form with {name} already chosen.", { name })}</Notice>}
    </div>
  );
}
