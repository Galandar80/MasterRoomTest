import type { DiceRequest } from "@/lib/types";

export type CardDeckType = "poker" | "regional";

const diceCountPattern = /^\[dice_count=(\d+)\]\s*/i;

export function encodeDiceReason(reason: string, diceCount: number) {
  const cleanReason = stripDiceCountMarker(reason);
  return diceCount > 1 ? `[dice_count=${diceCount}] ${cleanReason}`.trim() : cleanReason;
}

export function stripDiceCountMarker(reason: string) {
  return reason.replace(diceCountPattern, "").trim();
}

export function getDiceCount(request: Pick<DiceRequest, "dice_count" | "reason">) {
  if (request.dice_count && request.dice_count > 0) return request.dice_count;
  const match = request.reason.match(diceCountPattern);
  return match ? Math.max(1, Number(match[1])) : 1;
}

export function rollDice(count: number, sides: number) {
  const results = Array.from({ length: Math.max(1, count) }, () => Math.floor(Math.random() * sides) + 1);
  return {
    results,
    total: results.reduce((sum, value) => sum + value, 0)
  };
}

export function drawCard(deck: CardDeckType) {
  const cards = deck === "poker" ? pokerDeck : regionalItalianDeck;
  return cards[Math.floor(Math.random() * cards.length)];
}

export function cardDeckLabel(deck: CardDeckType) {
  return deck === "poker" ? "mazzo poker" : "mazzo regionale italiano";
}

const pokerDeck = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].flatMap((value) =>
  ["Cuori", "Quadri", "Fiori", "Picche"].map((suit) => `${value} di ${suit}`)
);

const regionalItalianDeck = ["Asso", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"].flatMap((value) =>
  ["Coppe", "Denari", "Spade", "Bastoni"].map((suit) => `${value} di ${suit}`)
);
