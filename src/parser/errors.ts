import type { SourceLocation } from '../types.js';

export class KuiSyntaxError extends Error {
  constructor(
    message: string,
    public readonly loc: SourceLocation,
    public readonly source?: string,
  ) {
    const locStr = `${loc.line}:${loc.column}`;
    super(`${message} at ${locStr}`);
    this.name = 'KuiSyntaxError';
  }

  format(): string {
    if (!this.source) return this.message;
    const lines = this.source.split('\n');
    const errorLine = lines[this.loc.line - 1] || '';
    const pointer = `${' '.repeat(this.loc.column - 1)}^`;
    return `${this.message}\n  ${this.loc.line} | ${errorLine}\n    | ${pointer}`;
  }
}
