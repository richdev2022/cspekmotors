import os from "node:os";
import path from "node:path";

export function getUploadRoot(): string {
  if (process.env.UPLOAD_DIR) return path.resolve(process.env.UPLOAD_DIR);

  const cwd = process.cwd();
  const isServerless = process.env.VERCEL === "1"
    || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
    || cwd.startsWith("/var/task");

  return isServerless ? path.join(os.tmpdir(), "cspek-uploads") : path.join(cwd, "uploads");
}
