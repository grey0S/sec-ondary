import Anthropic from "@anthropic-ai/sdk";
import type { Difficulty, MissionKind } from "@prisma/client";
import { BASE_XP } from "@/lib/game/xp-ranks";

export type GeneratedMissionPayload = {
  title: string;
  description: string;
  difficulty: Difficulty;
  minParticipants: number;
  maxParticipants: number;
  kind: MissionKind;
};

const DIFFICULTIES: Difficulty[] = [
  "VERY_EASY",
  "EASY",
  "MEDIUM",
  "HARD",
  "EXPLOSIVE",
];

const SYSTEM = `Eres el motor creativo de "sec·ondary", una app de misiones secundarias cortas y divertidas entre amigos.
Reglas:
- Responde SOLO con un JSON válido, sin markdown.
- El JSON debe tener: title (string corto y pegadizo), description (2-4 frases, tono divertido, en español),
  difficulty (uno de: VERY_EASY, EASY, MEDIUM, HARD, EXPLOSIVE),
  minParticipants y maxParticipants (enteros entre 1 y 8, min <= max).
- Si difficulty es EXPLOSIVE: la misión debe sonar loca e impredecible; minParticipants y maxParticipants deben ser al menos 2 (grupo obligatorio).
- Para misiones normales: contexto del usuario (lugar, hora, situación) debe inspirar la misión.
- kind en el JSON siempre será "NORMAL" salvo que el usuario pida explícitamente misión urgente; si es urgente usa "URGENT" (misma estructura).
Esquema exacto:
{"title":"","description":"","difficulty":"MEDIUM","minParticipants":2,"maxParticipants":4,"kind":"NORMAL"}`;

function fallbackMission(context: string, urgent: boolean): GeneratedMissionPayload {
  const ctx = context.toLowerCase();
  let title = "Misión relámpago";
  let description =
    "Haced una coreografía ridícula de 20 segundos y grabadla en vertical. El más serio del grupo pierde.";
  let difficulty: Difficulty = "EASY";
  let minP = 2;
  let maxP = 4;

  if (urgent) {
    title = "¡Misión urgente!";
    description =
      "En los próximos minutos: cada uno dice una palabra al azar y construís una historia grupal de 3 frases. Sin repetir palabras.";
    difficulty = "MEDIUM";
    minP = 1;
    maxP = 6;
  }

  if (ctx.includes("casa") || ctx.includes("hogar")) {
    title = "Chef caótico";
    description =
      "Inventad un snack solo con lo que hay en la cocina. Presentadlo como si fuera un plato Michelin. Foto grupal del 'plato'.";
    minP = 2;
    maxP = 5;
  } else if (ctx.includes("calle") || ctx.includes("parque")) {
    title = "Modo turista extremo";
    description =
      "Elegid un monumento o esquina aburrida y haced de guías turísticos exagerados durante 60 segundos. Alguien filma.";
    difficulty = "MEDIUM";
    minP = 2;
    maxP = 6;
  } else if (ctx.includes("shopping") || ctx.includes("mall") || ctx.includes("centro comercial")) {
    title = "Desfile invisible";
    description =
      "Caminad por un pasillo como si fuera pasarela. Uno elige la música tarareando. Sin molestar a terceros.";
    difficulty = "HARD";
    minP = 2;
    maxP = 4;
  } else if (ctx.includes("noche") || ctx.includes("fiesta")) {
    title = "Leyenda nocturna";
    description =
      "Cada uno inventa un rumor absurdo sobre el grupo; votá el más creíble. El ganador recibe un título honorífico ridículo.";
    difficulty = "VERY_EASY";
    minP = 2;
    maxP = 8;
  }

  if (ctx.includes("explosiva") || ctx.includes("explosivo")) {
    title = "Protocolo caos";
    description =
      "En 90 segundos: intercambiad roles (voz, caminar, gestos) sin romper personaje. Si alguien se ríe, reinicio. Solo valientes.";
    difficulty = "EXPLOSIVE";
    minP = 3;
    maxP = 8;
  }

  return {
    title,
    description,
    difficulty,
    minParticipants: minP,
    maxParticipants: Math.max(minP, maxP),
    kind: urgent ? "URGENT" : "NORMAL",
  };
}

function parseJson(text: string): GeneratedMissionPayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const difficulty = raw.difficulty as string;
    if (!DIFFICULTIES.includes(difficulty as Difficulty)) return null;
    const minP = Number(raw.minParticipants);
    const maxP = Number(raw.maxParticipants);
    if (!Number.isFinite(minP) || !Number.isFinite(maxP)) return null;
    const kind = raw.kind === "URGENT" ? "URGENT" : "NORMAL";
    let minParticipants = Math.min(8, Math.max(1, Math.floor(minP)));
    let maxParticipants = Math.min(8, Math.max(1, Math.floor(maxP)));
    if (minParticipants > maxParticipants) [minParticipants, maxParticipants] = [maxParticipants, minParticipants];
    if (difficulty === "EXPLOSIVE" && minParticipants < 2) minParticipants = 2;
    return {
      title: String(raw.title || "Misión").slice(0, 120),
      description: String(raw.description || "").slice(0, 800),
      difficulty: difficulty as Difficulty,
      minParticipants,
      maxParticipants,
      kind: kind as MissionKind,
    };
  } catch {
    return null;
  }
}

export async function generateMissionWithAI(
  context: string,
  options: { urgent?: boolean; explosiveOnly?: boolean } = {},
): Promise<GeneratedMissionPayload> {
  const urgent = options.urgent === true;
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return fallbackMission(context + (options.explosiveOnly ? " explosiva" : ""), urgent);
  }

  const client = new Anthropic({ apiKey: key });
  const userMsg = [
    `Contexto del jugador: ${context || "sin contexto específico"}.`,
    urgent ? "Genera una MISIÓN URGENTE (kind URGENT): corta, intensa, debe poder hacerse ya." : "",
    options.explosiveOnly
      ? "La dificultad DEBE ser EXPLOSIVE y requiere grupo (min 2)."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return fallbackMission(context, urgent);
    const parsed = parseJson(block.text);
    if (!parsed) return fallbackMission(context, urgent);
    if (options.explosiveOnly) {
      parsed.difficulty = "EXPLOSIVE";
      parsed.minParticipants = Math.max(2, parsed.minParticipants);
    }
    if (urgent) parsed.kind = "URGENT";
    return parsed;
  } catch {
    return fallbackMission(context, urgent);
  }
}

export function baseXpForPayload(p: GeneratedMissionPayload): number {
  return BASE_XP[p.difficulty];
}
