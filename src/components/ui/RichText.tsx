import { Fragment } from "react";
import { parseInline, type Blocks } from "@/lib/content/blocks";
import { Alert } from "./Alert";

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) =>
        part.kind === "bold" ? (
          <strong key={i}>{part.text}</strong>
        ) : part.kind === "link" ? (
          <a
            key={i}
            href={part.href}
            className="text-link-default underline underline-offset-4 hover:text-link-hover"
          >
            {part.text}
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Renders stored content blocks. Text is always escaped by React; only safe links are allowed. */
export function RichText({ blocks }: { blocks: Blocks }) {
  return (
    <div className="grid max-w-prose gap-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return b.level === 2 ? (
              <h2 key={i} className="mt-4 text-2xl">
                <InlineText text={b.text} />
              </h2>
            ) : (
              <h3 key={i} className="mt-2 text-xl">
                <InlineText text={b.text} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={i}>
                <InlineText text={b.text} />
              </p>
            );
          case "list": {
            const List = b.ordered ? "ol" : "ul";
            return (
              <List key={i} className={b.ordered ? "list-decimal pl-6" : "list-disc pl-6"}>
                {b.items.map((item, j) => (
                  <li key={j} className="mb-1">
                    <InlineText text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "callout":
            return (
              <Alert key={i} tone={b.tone}>
                <p>
                  <InlineText text={b.text} />
                </p>
              </Alert>
            );
        }
      })}
    </div>
  );
}
