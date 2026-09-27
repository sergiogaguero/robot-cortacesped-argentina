import { llmsFullTxt } from "@/lib/llms";

export async function GET() {
  return new Response(await llmsFullTxt(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
