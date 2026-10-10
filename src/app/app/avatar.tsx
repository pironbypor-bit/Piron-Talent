/* eslint-disable @next/next/no-img-element */

/** A person's photo if they uploaded one, else the first letter of their name. */
export function AvatarImg({ name, url, size = 10 }: { name: string; url: string | null; size?: 10 | 14 }) {
  const cls = size === 14 ? "size-14 text-xl" : "size-10";
  if (url) return <img src={url} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`flex ${cls} shrink-0 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-900`} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
