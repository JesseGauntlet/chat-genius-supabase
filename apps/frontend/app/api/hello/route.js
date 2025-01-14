export async function GET() {
    return new Response(JSON.stringify({ message: "Hello from test route" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(req) {
    const body = await req.json();
    return new Response(JSON.stringify({ message: "POST success", body }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}