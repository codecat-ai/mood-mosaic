import { normalizeEntries } from './journal';
import type { ImportDateRange } from './importPreview';

export interface BackupSanityCheck {
  isJsonValid: boolean;
  schemaVersion: number | null;
  rawEntryCount: number | null;
  validEntryCount: number;
  issueCount: number;
  issues: string[];
  dateRange: ImportDateRange | null;
  summary: string;
}

export function summarizeBackupJson(source: string): BackupSanityCheck {
  if (source.trim().length === 0) {
    return invalidSummary(['Paste backup JSON to check it.'], 'No JSON pasted yet.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return invalidSummary(['Backup must be valid JSON.'], 'Invalid JSON.');
  }

  if (!isRecord(parsed)) {
    return objectShapeSummary(null, null, ['Backup must be a JSON object with an entries array.']);
  }

  const schemaVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : null;

  if (!Array.isArray(parsed.entries)) {
    return objectShapeSummary(schemaVersion, null, ['Backup entries must be an array.']);
  }

  const normalized = normalizeEntries(parsed.entries);
  const dateRange =
    normalized.entries.length > 0
      ? {
          start: normalized.entries[0].date,
          end: normalized.entries[normalized.entries.length - 1].date
        }
      : null;
  const issues = normalized.issues;

  return {
    isJsonValid: true,
    schemaVersion,
    rawEntryCount: parsed.entries.length,
    validEntryCount: normalized.entries.length,
    issueCount: issues.length,
    issues,
    dateRange,
    summary: buildSummary(
      schemaVersion,
      parsed.entries.length,
      normalized.entries.length,
      dateRange,
      issues
    )
  };
}

function invalidSummary(issues: string[], prefix: string): BackupSanityCheck {
  return {
    isJsonValid: false,
    schemaVersion: null,
    rawEntryCount: null,
    validEntryCount: 0,
    issueCount: issues.length,
    issues,
    dateRange: null,
    summary: `${prefix} ${issues.join(' ')}`
  };
}

function objectShapeSummary(
  schemaVersion: number | null,
  rawEntryCount: number | null,
  issues: string[]
): BackupSanityCheck {
  return {
    isJsonValid: true,
    schemaVersion,
    rawEntryCount,
    validEntryCount: 0,
    issueCount: issues.length,
    issues,
    dateRange: null,
    summary: buildSummary(schemaVersion, rawEntryCount, 0, null, issues)
  };
}

function buildSummary(
  schemaVersion: number | null,
  rawEntryCount: number | null,
  validEntryCount: number,
  dateRange: ImportDateRange | null,
  issues: readonly string[]
): string {
  const schemaText =
    schemaVersion === null ? 'No schema version found.' : `Schema version ${schemaVersion}.`;
  const rawText =
    rawEntryCount === null
      ? 'Found no raw entry array'
      : `Found ${pluralize(rawEntryCount, 'raw entry', 'raw entries')}`;
  const validText = `${pluralize(validEntryCount, 'valid entry', 'valid entries')}`;
  const rangeText = dateRange ? ` from ${dateRange.start} to ${dateRange.end}` : '';
  const issueText =
    issues.length > 0 ? ` ${pluralize(issues.length, 'issue', 'issues')}: ${issues.join(' ')}` : '';

  return `Valid JSON. ${schemaText} ${rawText} and ${validText}${rangeText}.${issueText}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
