import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin.' },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const validRoles = ['admin', 'manager', 'public'];
    const userRole = validRoles.includes(role) ? role : 'public';

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
