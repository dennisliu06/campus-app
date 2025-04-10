import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: "Campus Rides <notifications@campusrides.com>",
      to,
      subject,
      html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
