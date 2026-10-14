import type { Metadata } from "next";
import { getProvider } from "@/lib/app/queries";
import { ProviderProfile } from "../provider-profile";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; reported?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProvider(id);
  return { title: data?.provider.display_name ?? "Piron Work" };
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const [{ id }, { error, reported }] = await Promise.all([params, searchParams]);
  return <ProviderProfile id={id} base="/app" error={error} reported={reported} />;
}
