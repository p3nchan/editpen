import chalk from "chalk";
import type { Finding, Report } from "../engine/loader.js";

function severityLabel(finding: Finding): string {
  if (finding.severity === "error") {
    return chalk.red("ERROR");
  }
  if (finding.severity === "warn") {
    return chalk.yellow("WARN ");
  }
  return chalk.blue("INFO ");
}

export function formatHuman(report: Report, sourceName = "<text>"): string {
  if (report.findings.length === 0) {
    return `${chalk.green("No findings.")} ${sourceName}`;
  }
  const lines = report.findings.map((finding) => {
    const position = `${sourceName}:${finding.span.line}:${finding.span.column}`;
    const evidence = `[${finding.status}, ${finding.evidenceGrade}${finding.housePolicy === true ? ", house policy" : ""}]`;
    const measurement = finding.value === undefined
      ? ""
      : ` (${finding.value.toFixed(3)}; threshold ${finding.threshold?.toFixed(3) ?? "n/a"})`;
    return `${position}  ${severityLabel(finding)}  ${chalk.bold(finding.ruleId)} ${evidence} ${finding.message}${measurement}`;
  });
  lines.push(
    `\n${report.summary.total} finding(s): ${report.summary.error} error, ${report.summary.warn} warn, ${report.summary.info} info`,
  );
  return lines.join("\n");
}
