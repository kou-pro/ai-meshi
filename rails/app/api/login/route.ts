import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  console.log("LOGIN ROUTE HIT");
  console.log("CALLING RAILS:", "http://rails:3000/auth/sign_in");

  const res = await fetch("http://rails:3000/auth/sign_in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Login failed" }, { status: 401 });
  }

  const responseHeaders = res.headers;

  const accessToken = responseHeaders.get("access-token");
  const client = responseHeaders.get("client");
  const uid = responseHeaders.get("uid");
  const expiry = responseHeaders.get("expiry");

  const cookieStore = cookies();

  cookieStore.set("access-token", accessToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set("client", client!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set("uid", uid!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set("expiry", expiry!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ success: true });
}
