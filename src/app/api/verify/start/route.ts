console.log('🔥 VERIFY_START MODULE LOADING');

export const runtime = 'nodejs';

export async function POST(req: Request) {
  console.log('🔥 VERIFY_START HANDLER ENTERED');
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
