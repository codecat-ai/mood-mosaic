import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, type JournalEntry } from './journal';
import { createPrintableReflectionHtml, createReflectionMarkdown } from './reflectionExports';
import { filterEntriesByTrend } from './summary';

const entries: JournalEntry[] = [
  entry({
    date: '2026-05-17',
    mood: 'stressed',
    energy: 1,
    focus: 2,
    note: 'Outside week'
  }),
  entry({
    date: '2026-05-18',
    mood: 'focused',
    energy: 5,
    focus: 4,
    note: 'Drafted **plan** with [links](x) and <section>'
  }),
  entry({
    date: '2026-05-21',
    mood: 'calm',
    energy: 3,
    focus: 5,
    note: '  HTML-like <tag attr="1"> & markdown # heading\n\nsecond line  '
  })
];

describe('reflection exports', () => {
  it('creates deterministic Markdown from filtered entries with escaped user content', () => {
    const trend = filterEntriesByTrend(entries, 'week', '2026-05-21');
    const markdown = createReflectionMarkdown({
      title: 'Mood Mosaic Reflection',
      rangeLabel: trend.label,
      generatedLabel: 'Generated from test fixture',
      entries: trend.entries
    });

    expect(markdown).toBe(`# Mood Mosaic Reflection

Generated from test fixture
Range: This week: 2026\\-05\\-18 to 2026\\-05\\-24
Date range: 2026\\-05\\-18 to 2026\\-05\\-21
Entries: 2
Mood mix: calm \\(1\\), focused \\(1\\)
Average energy: 4/5
Average focus: 4.5/5

## Entries

- 2026\\-05\\-18 - focused - Energy 5/5 - Focus 4/5
  Note: Drafted \\*\\*plan\\*\\* with \\[links\\]\\(x\\) and &lt;section&gt;
- 2026\\-05\\-21 - calm - Energy 3/5 - Focus 5/5
  Note: HTML\\-like &lt;tag attr=&quot;1&quot;&gt; &amp; markdown \\# heading second line`);
    expect(markdown).not.toMatch(/undefined|null/);
    expect(markdown).not.toContain('Outside week');
  });

  it('creates printable HTML with escaped content and no live current time', () => {
    const html = createPrintableReflectionHtml({
      title: 'Mood <Mosaic>',
      rangeLabel: 'All time',
      generatedLabel: 'Fixture export v1',
      entries: entries.slice(1)
    });

    expect(html).toContain('<title>Mood &lt;Mosaic&gt;</title>');
    expect(html).toContain('<h1>Mood &lt;Mosaic&gt;</h1>');
    expect(html).toContain('<p class="generated">Fixture export v1</p>');
    expect(html).toContain('<dt>Entries</dt><dd>2</dd>');
    expect(html).toContain('Drafted **plan** with [links](x) and &lt;section&gt;');
    expect(html).toContain(
      'HTML-like &lt;tag attr=&quot;1&quot;&gt; &amp; markdown # heading second line'
    );
    expect(html).not.toMatch(/undefined|null/);
    expect(html).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('renders an empty export without undefined values', () => {
    const markdown = createReflectionMarkdown({
      rangeLabel: 'This month: May 2026',
      entries: []
    });
    const html = createPrintableReflectionHtml({
      rangeLabel: 'This month: May 2026',
      entries: []
    });

    expect(markdown).toContain('Entries: 0');
    expect(markdown).toContain('Date range: No entries');
    expect(markdown).toContain('- No entries in this export.');
    expect(markdown).not.toMatch(/undefined|null/);
    expect(html).toContain('<dd>No entries</dd>');
    expect(html).toContain('<p class="empty">No entries in this export.</p>');
    expect(html).not.toMatch(/undefined|null/);
  });

  it('omits accidental undefined and null text values from notes', () => {
    const markdown = createReflectionMarkdown({
      rangeLabel: 'All time',
      entries: [
        entry({
          date: '2026-05-22',
          mood: 'reflective',
          energy: 4,
          focus: 4,
          note: 'undefined'
        }),
        entry({
          date: '2026-05-23',
          mood: 'steady',
          energy: 3,
          focus: 3,
          note: 'null'
        })
      ]
    });

    expect(markdown).not.toContain('Note:');
    expect(markdown).not.toMatch(/undefined|null/);
  });

  it('normalizes and truncates notes predictably at bounds', () => {
    const markdown = createReflectionMarkdown({
      rangeLabel: 'All time',
      entries: [
        entry({
          date: '2026-05-22',
          mood: 'reflective',
          energy: 4,
          focus: 4,
          note: `First line\t\twith gaps\nSecond line ${'long '.repeat(20)}`
        })
      ],
      noteMaxLength: 48
    });

    expect(markdown).toContain('Note: First line with gaps Second line long long long...');
    expect(markdown).not.toContain('\t');
  });
});

function entry(overrides: Omit<JournalEntry, 'schemaVersion'>): JournalEntry {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...overrides
  };
}
