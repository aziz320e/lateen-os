import type { SearchHit } from '../domain/types.js';

/** Highlight port — generates search snippets. */
export interface SearchHighlighter {
  highlight(hits: readonly SearchHit[], query: string): readonly SearchHit[];
}

export class DefaultSearchHighlighter implements SearchHighlighter {
  highlight(hits: readonly SearchHit[], query: string): readonly SearchHit[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return hits.map((hit) => {
      let snippet = hit.description ?? hit.title;
      for (const term of terms) {
        const regex = new RegExp(`(${term})`, 'gi');
        snippet = snippet.replace(regex, '<em>$1</em>');
      }
      return {
        ...hit,
        highlights: [{ field: 'description', snippet: snippet.slice(0, 200) }],
      };
    });
  }
}
