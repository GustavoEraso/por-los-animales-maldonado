interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renders a JSON-LD structured data block for search engine rich results.
 *
 * Must be used in a Server Component (or an inherently static context) since it injects
 * raw script markup.
 *
 * @param props - Component props
 * @param props.data - A plain object that will be serialized as the JSON-LD payload
 * @returns A `<script>` tag with the JSON-LD payload
 *
 * @example
 * <JsonLd
 *   data={{
 *     '@context': 'https://schema.org',
 *     '@type': 'Organization',
 *     name: 'Por Los Animales Maldonado',
 *     url: SITE_URL,
 *   }}
 * />
 */
export default function JsonLd({ data }: JsonLdProps): React.ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
