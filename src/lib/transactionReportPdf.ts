import type { GroupTransactionReport, ReportTransfer } from "@/lib/types";

type Color = [number, number, number];
type FontName = "F1" | "F2";

type TextOptions = {
  size?: number;
  color?: Color;
  font?: FontName;
};

type NetRow = {
  id: string;
  name: string;
  incoming: number;
  outgoing: number;
  net: number;
};

type TableTone = "neutral" | "success" | "danger" | "warning";
type TableRow = string[] | { cells: string[]; tone?: TableTone };
type PdfImage = {
  binary: string;
  width: number;
  height: number;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 38;
const RIGHT = 38;
const TOP = 38;
const BOTTOM = 42;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;
const BACKGROUND_IMAGE_URL = "/background.jpg";
const BACKGROUND_IMAGE_MAX_WIDTH = 1200;

const COLORS = {
  ink: [30, 41, 59] as Color,
  muted: [100, 116, 139] as Color,
  faint: [241, 245, 249] as Color,
  line: [203, 213, 225] as Color,
  primary: [37, 99, 235] as Color,
  primaryDark: [30, 64, 175] as Color,
  accent: [20, 184, 166] as Color,
  success: [22, 163, 74] as Color,
  successSoft: [240, 253, 244] as Color,
  successWash: [220, 252, 231] as Color,
  danger: [220, 38, 38] as Color,
  dangerSoft: [254, 242, 242] as Color,
  dangerWash: [254, 226, 226] as Color,
  warning: [217, 119, 6] as Color,
  warningSoft: [255, 251, 235] as Color,
  warningWash: [254, 243, 199] as Color,
  white: [255, 255, 255] as Color,
};

const TONE_STYLES: Record<TableTone, { ink: Color; fill: Color; wash: Color; line: Color }> = {
  neutral: {
    ink: COLORS.ink,
    fill: COLORS.white,
    wash: COLORS.faint,
    line: COLORS.line,
  },
  success: {
    ink: COLORS.success,
    fill: COLORS.successSoft,
    wash: COLORS.successWash,
    line: COLORS.success,
  },
  danger: {
    ink: COLORS.danger,
    fill: COLORS.dangerSoft,
    wash: COLORS.dangerWash,
    line: COLORS.danger,
  },
  warning: {
    ink: COLORS.warning,
    fill: COLORS.warningSoft,
    wash: COLORS.warningWash,
    line: COLORS.warning,
  },
};

const cleanText = (value: unknown) =>
  String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapePdfText = (value: string) =>
  cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const formatCoins = (value: number) => {
  const amount = Number(value || 0);
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)} coins`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const shortDate = (value?: string | null) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const textWidth = (text: string, size: number) => cleanText(text).length * size * 0.52;

const splitLongWord = (word: string, maxWidth: number, size: number) => {
  const parts: string[] = [];
  let current = "";

  for (const char of word) {
    const candidate = `${current}${char}`;
    if (!current || textWidth(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      parts.push(current);
      current = char;
    }
  }

  if (current) parts.push(current);
  return parts;
};

const wrapText = (text: string, maxWidth: number, size = 10) => {
  const words = cleanText(text)
    .split(" ")
    .filter(Boolean)
    .flatMap((word) => (textWidth(word, size) > maxWidth ? splitLongWord(word, maxWidth, size) : word));
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || textWidth(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const truncateText = (text: string, maxWidth: number, size = 9) => {
  const cleaned = cleanText(text);
  if (textWidth(cleaned, size) <= maxWidth) return cleaned;

  let result = cleaned;
  while (result.length > 3 && textWidth(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result.trim()}...`;
};

const rgb = (color: Color) => color.map((value) => (value / 255).toFixed(3)).join(" ");

const arrayBufferToBinaryString = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return binary;
};

const blobToBinaryString = async (blob: Blob) => arrayBufferToBinaryString(await blob.arrayBuffer());

const loadPdfBackgroundImage = async (): Promise<PdfImage | null> => {
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = BACKGROUND_IMAGE_URL;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not load PDF background image"));
    });

    const scale = Math.min(1, BACKGROUND_IMAGE_MAX_WIDTH / image.naturalWidth);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.72);
    });

    if (!blob) return null;

    return {
      binary: await blobToBinaryString(blob),
      width,
      height,
    };
  } catch {
    return null;
  }
};

const getBackgroundDrawCommand = (image: PdfImage) => {
  const imageRatio = image.width / image.height;
  const pageRatio = PAGE_WIDTH / PAGE_HEIGHT;
  const height = imageRatio > pageRatio ? PAGE_HEIGHT : PAGE_WIDTH / imageRatio;
  const width = imageRatio > pageRatio ? PAGE_HEIGHT * imageRatio : PAGE_WIDTH;
  const x = (PAGE_WIDTH - width) / 2;
  const y = (PAGE_HEIGHT - height) / 2;

  return [
    "q",
    "/GSBG gs",
    `${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`,
    "/BG Do",
    "Q",
    "\n",
  ].join("\n");
};

const toneForResult = (result: string): TableTone => {
  if (result === "Won") return "success";
  if (result === "Lost") return "danger";
  return "warning";
};

const toneForCustomAnswer = (
  answer: GroupTransactionReport["customBetSections"][number]["answers"][number] | undefined
): TableTone => {
  if (answer?.isWinner === true) return "success";
  if (answer?.isWinner === false) return "danger";
  return "warning";
};

const buildNetRows = (report: GroupTransactionReport) => {
  const netByUser = new Map<string, NetRow>();

  for (const member of report.group.members) {
    netByUser.set(member.id, { id: member.id, name: member.name, incoming: 0, outgoing: 0, net: 0 });
  }

  const applyTransfer = (transfer: ReportTransfer) => {
    const from = netByUser.get(transfer.fromUser.id) || {
      id: transfer.fromUser.id,
      name: transfer.fromUser.name,
      incoming: 0,
      outgoing: 0,
      net: 0,
    };
    from.outgoing += transfer.amount;
    from.net -= transfer.amount;
    netByUser.set(transfer.fromUser.id, from);

    const to = netByUser.get(transfer.toUser.id) || {
      id: transfer.toUser.id,
      name: transfer.toUser.name,
      incoming: 0,
      outgoing: 0,
      net: 0,
    };
    to.incoming += transfer.amount;
    to.net += transfer.amount;
    netByUser.set(transfer.toUser.id, to);
  };

  report.matchSections.forEach((section) => section.transfers.forEach(applyTransfer));
  report.customBetSections.forEach((section) => section.transfers.forEach(applyTransfer));

  return Array.from(netByUser.values()).sort((a, b) => b.net - a.net || a.name.localeCompare(b.name));
};

const transferTextForMember = (transfers: ReportTransfer[], memberId?: string) => {
  if (!memberId) return "Open the group to see member transfers";

  const related = transfers.filter(
    (transfer) => transfer.fromUser.id === memberId || transfer.toUser.id === memberId
  );

  if (related.length === 0) return "No transfer for you";

  return related
    .map((transfer) =>
      transfer.fromUser.id === memberId
        ? `You pay ${transfer.toUser.name} ${formatCoins(transfer.amount)}`
        : `${transfer.fromUser.name} pays you ${formatCoins(transfer.amount)}`
    )
    .join("; ");
};

const getMemberBetResult = (
  bet: GroupTransactionReport["matchSections"][number]["bets"][number] | undefined,
  winner?: string | null
) => {
  if (!bet) return "No pick";
  if (!winner) return bet.settled ? "Settled" : "Pending";
  return bet.teamSelected === winner ? "Won" : "Lost";
};

class PdfLayout {
  private pages: string[] = [];
  private content = "";
  private y = TOP;

  addPage() {
    if (this.content) this.pages.push(this.content);
    this.content = "";
    this.y = TOP;
  }

  finish() {
    if (this.content || this.pages.length === 0) this.pages.push(this.content);
    return this.pages;
  }

  cursorY() {
    return this.y;
  }

  ensure(height: number) {
    if (this.y + height > PAGE_HEIGHT - BOTTOM) this.addPage();
  }

  gap(value: number) {
    this.y += value;
  }

  rect(x: number, y: number, width: number, height: number, fill?: Color, stroke?: Color) {
    const pdfY = PAGE_HEIGHT - y - height;
    if (fill) this.content += `q ${rgb(fill)} rg ${x} ${pdfY.toFixed(2)} ${width} ${height} re f Q\n`;
    if (stroke) this.content += `q ${rgb(stroke)} RG ${x} ${pdfY.toFixed(2)} ${width} ${height} re S Q\n`;
  }

  text(text: string, x: number, y: number, options: TextOptions = {}) {
    const size = options.size || 10;
    const color = options.color || COLORS.ink;
    const font = options.font || "F1";
    const pdfY = PAGE_HEIGHT - y;
    this.content += `BT /${font} ${size} Tf ${rgb(color)} rg ${x} ${pdfY.toFixed(2)} Td (${escapePdfText(
      text
    )}) Tj ET\n`;
  }

  wrapped(text: string, x: number, width: number, options: TextOptions & { lineHeight?: number } = {}) {
    const size = options.size || 10;
    const lineHeight = options.lineHeight || size + 4;
    const lines = wrapText(text, width, size);

    lines.forEach((line, index) => this.text(line, x, this.y + index * lineHeight, options));
    this.y += lines.length * lineHeight;
  }

  sectionTitle(title: string) {
    this.ensure(30);
    this.text(title, LEFT, this.y, { size: 14, font: "F2", color: COLORS.primaryDark });
    this.y += 20;
  }

  statCard(x: number, title: string, value: string, color: Color) {
    this.rect(x, this.y, 122, 58, COLORS.faint, COLORS.line);
    this.rect(x, this.y, 122, 5, color);
    this.text(title, x + 10, this.y + 21, { size: 8, color: COLORS.muted, font: "F2" });
    const valueLines = wrapText(value, 102, 10).slice(0, 2);
    valueLines.forEach((line, index) => {
      this.text(truncateText(line, 102, 10), x + 10, this.y + 37 + index * 11, {
        size: 10,
        color,
        font: "F2",
      });
    });
  }

  private gradientOutline(x: number, y: number, width: number, height: number, tone: TableTone) {
    const style = TONE_STYLES[tone];
    this.rect(x, y, 4, height, style.line);
    this.rect(x + 4, y, 4, height, style.wash);
    this.rect(x + 8, y, 4, height, style.fill);
    this.rect(x, y, width, 2, style.line);
    this.rect(x, y + 2, width, 2, style.wash);
    this.rect(x, y + height - 4, width, 2, style.wash);
    this.rect(x, y + height - 2, width, 2, style.line);
  }

  table(headers: string[], rows: TableRow[], widths: number[]) {
    const headerHeight = 24;
    const lineHeight = 10;
    const maxLines = 4;
    this.ensure(headerHeight + 8);

    const drawHeader = () => {
      let x = LEFT;
      this.rect(LEFT, this.y, CONTENT_WIDTH, headerHeight, COLORS.primaryDark);
      headers.forEach((header, index) => {
        this.text(header, x + 6, this.y + 16, { size: 8, color: COLORS.white, font: "F2" });
        x += widths[index];
      });
      this.y += headerHeight;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const cells = Array.isArray(row) ? row : row.cells;
      const tone = Array.isArray(row) ? "neutral" : row.tone || "neutral";
      const style = TONE_STYLES[tone];
      const cellLines = cells.map((cell, index) => {
        const wrapped = wrapText(cell, widths[index] - 12, 8);
        const lines = wrapped.slice(0, maxLines);

        if (wrapped.length > maxLines) {
          lines[maxLines - 1] = truncateText(`${lines[maxLines - 1]}...`, widths[index] - 12, 8);
        }

        return lines.length ? lines : ["-"];
      });
      const lineCount = Math.max(...cellLines.map((lines) => lines.length));
      const rowHeight = Math.max(32, 14 + lineCount * lineHeight);

      if (this.y + rowHeight > PAGE_HEIGHT - BOTTOM) {
        this.addPage();
        drawHeader();
      }

      const neutralFill = rowIndex % 2 === 0 ? [248, 250, 252] as Color : COLORS.white;
      this.rect(LEFT, this.y, CONTENT_WIDTH, rowHeight, tone === "neutral" ? neutralFill : style.fill, style.line);
      if (tone !== "neutral") {
        this.gradientOutline(LEFT, this.y, CONTENT_WIDTH, rowHeight, tone);
      }

      let x = LEFT;
      cellLines.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          const isOutcomeColumn = index === 1 || index === 2;
          this.text(truncateText(line, widths[index] - 12, 8), x + 6, this.y + 15 + lineIndex * lineHeight, {
            size: 8,
            color: tone !== "neutral" && isOutcomeColumn ? style.ink : COLORS.ink,
            font: index === 0 || (tone !== "neutral" && isOutcomeColumn) ? "F2" : "F1",
          });
        });
        x += widths[index];
      });

      this.y += rowHeight;
    });

    this.y += 10;
  }
}

const drawHeader = (pdf: PdfLayout, report: GroupTransactionReport, memberName: string) => {
  pdf.rect(0, 0, PAGE_WIDTH, 118, COLORS.primary);
  pdf.rect(0, 88, PAGE_WIDTH, 30, COLORS.accent);
  pdf.text("TossUp", LEFT, 38, { size: 24, color: COLORS.white, font: "F2" });
  pdf.text(truncateText(`${report.group.name} transaction report`, CONTENT_WIDTH, 15), LEFT, 63, {
    size: 15,
    color: COLORS.white,
    font: "F2",
  });
  pdf.text(truncateText(`Prepared for ${memberName} on ${formatDate(report.generatedAt)}`, CONTENT_WIDTH, 10), LEFT, 86, {
    size: 10,
    color: COLORS.white,
  });
  pdf.text(truncateText(`Invite ${report.group.inviteCode} | Owner ${report.group.owner.name}`, CONTENT_WIDTH, 9), LEFT, 105, {
    size: 9,
    color: COLORS.white,
  });
  pdf.gap(110);
};

const drawMemberOverview = (pdf: PdfLayout, report: GroupTransactionReport, memberId?: string) => {
  const netRows = buildNetRows(report);
  const memberNet = netRows.find((row) => row.id === memberId);
  const net = memberNet?.net || 0;
  const direction = net > 0 ? "To receive" : net < 0 ? "To pay" : "Settled";
  const memberBets = report.matchSections.flatMap((section) =>
    section.bets.filter((bet) => bet.user.id === memberId)
  );
  const settledWins = report.matchSections.filter((section) => {
    const bet = section.bets.find((row) => row.user.id === memberId);
    return bet && section.match.winner && bet.teamSelected === section.match.winner;
  }).length;

  pdf.ensure(90);
  pdf.statCard(
    LEFT,
    "YOUR NET POSITION",
    `${direction} ${formatCoins(Math.abs(net))}`,
    net < 0 ? COLORS.danger : COLORS.success
  );
  pdf.statCard(LEFT + 132, "MATCH PICKS", `${memberBets.length}/${report.summary.matchCount}`, COLORS.primary);
  pdf.statCard(LEFT + 264, "SETTLED WINS", `${settledWins}`, COLORS.accent);
  pdf.statCard(LEFT + 396, "COINS MOVED", formatCoins(report.summary.totalCoinsMoved), COLORS.warning);
  pdf.gap(72);

  pdf.wrapped(
    `This PDF is personalized for the downloading member. Match rows highlight your pick, result, stake, and only the transactions where you are the payer or receiver.`,
    LEFT,
    CONTENT_WIDTH,
    { size: 9, color: COLORS.muted, lineHeight: 13 }
  );
  pdf.gap(8);
};

const drawOutcomeLegend = (pdf: PdfLayout) => {
  pdf.ensure(24);
  const items: Array<{ label: string; tone: TableTone }> = [
    { label: "Won", tone: "success" },
    { label: "Lost", tone: "danger" },
    { label: "Pending / no pick", tone: "warning" },
  ];

  let x = LEFT;
  items.forEach((item) => {
    const style = TONE_STYLES[item.tone];
    const y = pdf.cursorY();
    pdf.rect(x, y + 1, 10, 10, style.fill, style.line);
    pdf.rect(x, y + 1, 3, 10, style.line);
    pdf.text(item.label, x + 15, y + 10, { size: 8, color: COLORS.muted, font: "F2" });
    x += item.label.length * 5.2 + 34;
  });
  pdf.gap(20);
};

const drawBalanceTable = (pdf: PdfLayout, report: GroupTransactionReport, memberId?: string) => {
  const rows = buildNetRows(report).map((row) => {
    const label = row.id === memberId ? `${row.name} (you)` : row.name;
    const status = row.net > 0 ? "Receives" : row.net < 0 ? "Pays" : "Settled";
    return [
      label,
      formatCoins(row.incoming),
      formatCoins(row.outgoing),
      `${status} ${formatCoins(Math.abs(row.net))}`,
    ];
  });

  pdf.sectionTitle("Member Balance");
  pdf.table(["Member", "Incoming", "Outgoing", "Net"], rows, [170, 110, 110, 129]);
};

const drawMatchTable = (pdf: PdfLayout, report: GroupTransactionReport, memberId?: string) => {
  pdf.sectionTitle("Matches And Your Transactions");
  drawOutcomeLegend(pdf);

  if (report.matchSections.length === 0) {
    pdf.wrapped("No match bets or match transfers have been recorded yet.", LEFT, CONTENT_WIDTH, {
      size: 10,
      color: COLORS.muted,
    });
    pdf.gap(10);
    return;
  }

  const rows: TableRow[] = report.matchSections.map((section) => {
    const memberBet = section.bets.find((bet) => bet.user.id === memberId);
    const result = section.match.winner ? `${section.match.winner} won` : `${section.match.status}, result pending`;
    const memberResult = getMemberBetResult(memberBet, section.match.winner);
    const pick = memberBet
      ? `${memberBet.teamSelected} (${memberResult})`
      : "No pick";

    return {
      tone: toneForResult(memberResult),
      cells: [
        `${section.match.teamA} vs ${section.match.teamB} | ${shortDate(section.match.startTime)}`,
        result,
        pick,
        memberBet ? formatCoins(memberBet.amount) : "-",
        transferTextForMember(section.transfers, memberId),
      ],
    };
  });

  pdf.table(["Match", "Result", "Your pick", "Stake", "Your transaction"], rows, [148, 96, 92, 54, 129]);
};

const drawCustomBets = (pdf: PdfLayout, report: GroupTransactionReport, memberId?: string) => {
  pdf.sectionTitle("Custom Bets");
  drawOutcomeLegend(pdf);

  if (report.customBetSections.length === 0) {
    pdf.wrapped("No custom bets have been created in this group yet.", LEFT, CONTENT_WIDTH, {
      size: 10,
      color: COLORS.muted,
    });
    return;
  }

  const rows: TableRow[] = report.customBetSections.map((customBet) => {
    const answer = customBet.answers.find((row) => row.user.id === memberId);
    const result = customBet.correctOption ? `Answer: ${customBet.correctOption}` : "Answer pending";
    const memberAnswer = answer
      ? `${answer.optionSelected} (${answer.isWinner === true ? "won" : answer.isWinner === false ? "lost" : "pending"})`
      : "No answer";

    return {
      tone: toneForCustomAnswer(answer),
      cells: [
        customBet.question,
        result,
        memberAnswer,
        answer ? formatCoins(answer.amount) : "-",
        transferTextForMember(customBet.transfers, memberId),
      ],
    };
  });

  pdf.table(["Custom bet", "Result", "Your answer", "Stake", "Your transaction"], rows, [148, 96, 92, 54, 129]);
};

const buildPdfBlob = async (report: GroupTransactionReport) => {
  const pdf = new PdfLayout();
  const backgroundImage = await loadPdfBackgroundImage();
  const member = report.generatedFor || report.group.members[0];
  const memberId = member?.id;
  const memberName = member?.name || "member";

  drawHeader(pdf, report, memberName);
  drawMemberOverview(pdf, report, memberId);
  drawBalanceTable(pdf, report, memberId);
  drawMatchTable(pdf, report, memberId);
  drawCustomBets(pdf, report, memberId);

  pdf.ensure(36);
  pdf.rect(LEFT, PAGE_HEIGHT - BOTTOM - 18, CONTENT_WIDTH, 1, COLORS.line);
  pdf.text("This report reflects transactions saved in TossUp when the PDF was generated.", LEFT, PAGE_HEIGHT - BOTTOM, {
    size: 8,
    color: COLORS.muted,
  });

  const pages = pdf.finish();
  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const backgroundImageId = backgroundImage
    ? addObject(
        `<< /Type /XObject /Subtype /Image /Width ${backgroundImage.width} /Height ${backgroundImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${backgroundImage.binary.length} >>\nstream\n${backgroundImage.binary}\nendstream`
      )
    : null;
  const backgroundOpacityId = backgroundImage
    ? addObject("<< /Type /ExtGState /CA 0.16 /ca 0.16 >>")
    : null;
  const pageIds: number[] = [];

  pages.forEach((pageContent) => {
    const fullPageContent = backgroundImage ? `${getBackgroundDrawCommand(backgroundImage)}${pageContent}` : pageContent;
    const xObjectResources = backgroundImageId ? `/XObject << /BG ${backgroundImageId} 0 R >>` : "";
    const graphicStateResources = backgroundOpacityId ? `/ExtGState << /GSBG ${backgroundOpacityId} 0 R >>` : "";
    const contentId = addObject(`<< /Length ${fullPageContent.length} >>\nstream\n${fullPageContent}endstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> ${xObjectResources} ${graphicStateResources} >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let rawPdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(rawPdf.length);
    rawPdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = rawPdf.length;
  rawPdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    rawPdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  rawPdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(rawPdf.length);
  for (let index = 0; index < rawPdf.length; index += 1) {
    bytes[index] = rawPdf.charCodeAt(index);
  }

  return new Blob([bytes], { type: "application/pdf" });
};

export const downloadGroupTransactionReportPdf = async (report: GroupTransactionReport) => {
  const blob = await buildPdfBlob(report);
  const url = URL.createObjectURL(blob);
  const member = report.generatedFor?.name ? `-${cleanText(report.generatedFor.name).toLowerCase()}` : "";
  const filenameBase = cleanText(report.group.name).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "group";
  const memberBase = member.replace(/[^a-z0-9]+/g, "-");
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filenameBase}${memberBase}-transaction-report.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
