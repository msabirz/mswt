import type { Graph } from "schema-dts";
import { serializeJsonLd } from "@/lib/seo/jsonld";

/** The page's single structured-data block (LD-01). Build the graph with pageGraph(). */
export function JsonLd({ graph }: { graph: Graph }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />;
}
