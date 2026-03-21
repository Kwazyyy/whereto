import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.ca", "hotmail.com", "hotmail.ca",
  "outlook.com", "outlook.ca", "live.com", "live.ca", "icloud.com",
  "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "mail.com", "zoho.com", "ymail.com", "msn.com", "bell.net",
  "rogers.com", "shaw.ca", "telus.net", "sympatico.ca",
  "cogeco.ca", "videotron.ca", "sasktel.net",
  "utoronto.ca", "ryerson.ca", "torontomu.ca", "yorku.ca", "mcgill.ca",
  "ubc.ca", "uwaterloo.ca", "queensu.ca", "uottawa.ca", "ualberta.ca",
  "umontreal.ca", "dal.ca", "usask.ca", "ucalgary.ca",
  "mail.utoronto.ca", "student.ubc.ca",
  "savrd.ca", "savrd.app",
];

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirmPassword } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const domain = email.trim().split("@")[1].toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Please use a valid email provider (Gmail, Outlook, iCloud, etc.)" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your name" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        hashedPassword,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
