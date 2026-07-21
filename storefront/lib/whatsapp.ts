import type { CartItem } from "./cart";

// Placeholder number — replace via NEXT_PUBLIC_WHATSAPP_NUMBER (country code +
// number, digits only, e.g. 919876543210). Orders are placed over WhatsApp:
// no payment gateway, delivery + payment are confirmed in the chat.
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";

// Trim a price to the shortest exact form: 129.00 → "129", 49.5 → "49.5".
function num(n: number): string {
  return Number(n.toFixed(2)).toString();
}

// Builds the order message in the exact block format the shop uses:
//   Name: <product>
//   Qty: <n>
//   Variant: <sku>
//   Cost: <unit price, 2dp>
//   ---
// then a "Total without shipping: q1 * p1 + q2 * p2 = <total>" line, followed
// by blank delivery fields for the customer to fill in.
export function buildOrderMessage(items: CartItem[]): string {
  const blocks = items.map((i) =>
    [
      `Name: ${i.productName}`,
      `Qty: ${i.qty}`,
      `Variant: ${i.sku}`,
      `Cost: ${i.price.toFixed(2)}`,
      `---`,
    ].join("\n"),
  );

  const expr = items.map((i) => `${i.qty} * ${num(i.price)}`).join(" + ");
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return [
    "Hello Andhra HomeFoods! I'd like to order:",
    "",
    blocks.join("\n"),
    "",
    `Total without shipping: ${expr} = ${num(total)}`,
    "",
    "My details —",
    "Name:",
    "Delivery address:",
    "Pincode:",
  ].join("\n");
}

export function whatsappOrderUrl(items: CartItem[]): string {
  const text = encodeURIComponent(buildOrderMessage(items));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
