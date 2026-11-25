import QRCode from "qrcode";

export function eventUrl(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/e/${token}`;
}

export function qrPng(url: string, size = 800): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: Math.min(Math.max(size, 200), 2000),
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#105C35", light: "#FFFFFF" },
  });
}
