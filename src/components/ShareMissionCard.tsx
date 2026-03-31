"use client";

import html2canvas from "html2canvas";

type Props = {
  missionTitle: string;
  xp: number;
  level: number;
  includePhoto?: string | null;
  branding?: string;
};

export function ShareMissionCard({
  missionTitle,
  xp,
  level,
  includePhoto,
  branding = "sec·ondary",
}: Props) {
  return (
    <div
      id="share-card"
      className="w-[320px] rounded-2xl overflow-hidden border border-[#00f5c8]/50 bg-gradient-to-br from-[#0f1020] via-[#12081f] to-[#061016] p-4 text-left"
    >
      <p className="font-display text-xs uppercase tracking-[0.3em] text-[#00f5c8] mb-2">{branding}</p>
      <h3 className="font-display text-lg font-black text-white leading-tight mb-3">{missionTitle}</h3>
      <div className="flex gap-3 text-sm">
        <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/10">
          <p className="text-[#7a7da3] text-[10px] uppercase tracking-wider">XP</p>
          <p className="font-display text-[#bf5fff] font-bold">+{xp}</p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/10">
          <p className="text-[#7a7da3] text-[10px] uppercase tracking-wider">Nivel</p>
          <p className="font-display text-[#00f5c8] font-bold">{level}</p>
        </div>
      </div>
      {includePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={includePhoto} alt="" className="mt-3 rounded-xl border border-white/10 max-h-40 w-full object-cover" />
      ) : null}
    </div>
  );
}

export async function captureShareCard(): Promise<Blob | null> {
  const el = document.getElementById("share-card");
  if (!el) return null;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#070712" });
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
}
