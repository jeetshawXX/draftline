import path from "node:path";

export function uploadDirectory() {
  return process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), "public", "uploads");
}
