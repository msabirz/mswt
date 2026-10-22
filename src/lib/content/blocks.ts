/**
 * Rich text is stored as typed blocks (never raw HTML), so content can't inject markup and the
 * admin editor (Step 8) can validate it. Inline text supports **bold** and [links](https://…).
 */
export type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "image"; mediaId: string }
  | { type: "callout"; tone: "info" | "warning"; text: string };

export type Blocks = Block[];
