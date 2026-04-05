import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, active } = body;

    // Check if email is being changed and already exists
    if (email && email !== existing.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email sudah digunakan' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) {
      const validRoles = ['admin', 'manager', 'public'];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }
    if (active !== undefined) updateData.active = active;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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
      data: user,
      message: 'User berhasil diperbarui',
    });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Don't allow admin to deactivate themselves
    if (id === admin.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menonaktifkan akun sendiri' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Deactivate instead of deleting
    const user = await db.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User berhasil dinonaktifkan',
    });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
