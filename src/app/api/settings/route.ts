import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const settings = await db.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Format settings tidak valid' },
        { status: 400 }
      );
    }

    // Upsert each setting
    const entries = Object.entries(settings) as [string, string][];
    for (const [key, value] of entries) {
      await db.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    // Return all settings
    const allSettings = await db.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
      message: 'Pengaturan berhasil disimpan',
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
