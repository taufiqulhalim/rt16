import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rt16bungah.id' },
    update: {},
    create: {
      name: 'Ketua RT',
      email: 'admin@rt16bungah.id',
      password: adminPassword,
      role: 'admin',
      active: true,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'bendahara@rt16bungah.id' },
    update: {},
    create: {
      name: 'Bendahara RT',
      email: 'bendahara@rt16bungah.id',
      password: managerPassword,
      role: 'manager',
      active: true,
    },
  });

  // Create public user
  const publicPassword = await bcrypt.hash('public123', 10);
  const publicUser = await prisma.user.upsert({
    where: { email: 'warga@rt16bungah.id' },
    update: {},
    create: {
      name: 'Warga RT',
      email: 'warga@rt16bungah.id',
      password: publicPassword,
      role: 'public',
      active: true,
    },
  });

  // Settings
  const settings = [
    { key: 'rt_name', value: 'RT 16 RW 06' },
    { key: 'desa', value: 'Desa Bungah' },
    { key: 'kecamatan', value: 'Kecamatan Bungah' },
    { key: 'kabupaten', value: 'Kabupaten Gresik' },
    { key: 'initial_balance', value: '2275000' },
    { key: 'period_start', value: '2019-02-28' },
    { key: 'period_end', value: '2024-12-31' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Sample transactions
  const transactions = [
    { date: '2019-02-28', description: 'Kas RT 16 periode 2017-2019', debit: 0, credit: 0, category: 'Saldo Awal' },
    { date: '2019-03-15', description: 'Iuran Dawis 4 (Maret) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2019-04-10', description: 'Fotocopy surat pengantar 110 x 20', debit: 0, credit: 2200, category: 'Pengeluaran' },
    { date: '2019-05-20', description: 'Iuran bulanan warga (Mei) 40 KK @ 10000', debit: 400000, credit: 0, category: 'Pemasukan' },
    { date: '2019-06-15', description: 'Sewa sound system malam tasyakuran 17 Agustus', debit: 0, credit: 350000, category: 'Pengeluaran' },
    { date: '2019-08-17', description: 'Pembuatan penyangga tiang bendera', debit: 0, credit: 150000, category: 'Pengeluaran' },
    { date: '2019-08-17', description: 'Hadiah Lomba 17 Agustus - Perlombaan anak-anak', debit: 0, credit: 250000, category: 'Pengeluaran' },
    { date: '2019-10-01', description: 'Sumbangan warga untuk pos ronda', debit: 300000, credit: 0, category: 'Pemasukan' },
    { date: '2019-12-20', description: 'Iuran bulanan warga (Des) 40 KK @ 10000', debit: 400000, credit: 0, category: 'Pemasukan' },
    { date: '2019-12-28', description: 'Saldo 2019', debit: 0, credit: 0, category: 'Saldo' },

    { date: '2020-02-10', description: 'Iuran Dawis 4 (Feb) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2020-03-15', description: 'Pembelian cat untuk pengecatan pos ronda', debit: 0, credit: 175000, category: 'Pengeluaran' },
    { date: '2020-05-20', description: 'Iuran bulanan warga (Mei) 42 KK @ 10000', debit: 420000, credit: 0, category: 'Pemasukan' },
    { date: '2020-06-01', description: 'Bantuan sembako warga terdampak COVID-19', debit: 0, credit: 1200000, category: 'Pengeluaran' },
    { date: '2020-08-15', description: 'Perlengkapan lomba 17 Agustus', debit: 0, credit: 300000, category: 'Pengeluaran' },
    { date: '2020-11-10', description: 'Sumbangan untuk renovasi mushola', debit: 500000, credit: 0, category: 'Pemasukan' },
    { date: '2020-12-28', description: 'Saldo 2020', debit: 0, credit: 0, category: 'Saldo' },

    { date: '2021-02-15', description: 'Iuran Dawis 4 (Feb) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2021-04-01', description: 'Iuran bulanan warga (Apr) 42 KK @ 10000', debit: 420000, credit: 0, category: 'Pemasukan' },
    { date: '2021-05-15', description: 'Pembelian alat kebersihan lingkungan', debit: 0, credit: 250000, category: 'Pengeluaran' },
    { date: '2021-07-20', description: 'Biaya pendaftaran Lomba Gresik Bisa', debit: 0, credit: 100000, category: 'Pengeluaran' },
    { date: '2021-08-17', description: 'Hadiah Lomba Gresik Bisa kategori Berkembang Juara 1 Best', debit: 0, credit: 0, category: 'Pengeluaran' },
    { date: '2021-09-10', description: 'Penghasilan dari juara lomba Gresik Bisa', debit: 2000000, credit: 0, category: 'Pemasukan' },
    { date: '2021-12-15', description: 'Iuran bulanan warga (Des) 42 KK @ 10000', debit: 420000, credit: 0, category: 'Pemasukan' },
    { date: '2021-12-28', description: 'Saldo 2021', debit: 0, credit: 0, category: 'Saldo' },

    { date: '2022-02-15', description: 'Iuran Dawis 4 (Feb) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2022-03-20', description: 'Iuran bulanan warga (Mar) 42 KK @ 10000', debit: 420000, credit: 0, category: 'Pemasukan' },
    { date: '2022-05-10', description: 'Perbaikan jalan lingkungan (material)', debit: 0, credit: 800000, category: 'Pengeluaran' },
    { date: '2022-06-15', description: 'Sumbangan HUT RI ke-77', debit: 750000, credit: 0, category: 'Pemasukan' },
    { date: '2022-08-15', description: 'Perlengkapan lomba 17 Agustus 2022', debit: 0, credit: 400000, category: 'Pengeluaran' },
    { date: '2022-10-01', description: 'Iuran bulanan warga (Okt) 42 KK @ 10000', debit: 420000, credit: 0, category: 'Pemasukan' },
    { date: '2022-12-28', description: 'Saldo 2022', debit: 0, credit: 0, category: 'Saldo' },

    { date: '2023-01-15', description: 'Iuran Dawis 4 (Jan) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2023-03-10', description: 'Iuran bulanan warga (Mar) 42 KK @ 15000', debit: 630000, credit: 0, category: 'Pemasukan' },
    { date: '2023-05-20', description: 'Biaya cetak kartu warga', debit: 0, credit: 350000, category: 'Pengeluaran' },
    { date: '2023-06-15', description: 'Sumbangan warga untuk kegiatan posyandu', debit: 250000, credit: 0, category: 'Pemasukan' },
    { date: '2023-08-17', description: 'Perlengkapan lomba 17 Agustus 2023', debit: 0, credit: 500000, category: 'Pengeluaran' },
    { date: '2023-09-01', description: 'Pembuatan papan nama RT', debit: 0, credit: 200000, category: 'Pengeluaran' },
    { date: '2023-11-15', description: 'Iuran bulanan warga (Nov) 42 KK @ 15000', debit: 630000, credit: 0, category: 'Pemasukan' },
    { date: '2023-12-28', description: 'Saldo 2023', debit: 0, credit: 0, category: 'Saldo' },

    { date: '2024-01-15', description: 'Iuran Dawis 4 (Jan) 19 Keluarga @ 5000', debit: 95000, credit: 0, category: 'Pemasukan' },
    { date: '2024-02-20', description: 'Iuran bulanan warga (Feb) 42 KK @ 15000', debit: 630000, credit: 0, category: 'Pemasukan' },
    { date: '2024-03-10', description: 'Perbaikan saluran air', debit: 0, credit: 650000, category: 'Pengeluaran' },
    { date: '2024-04-15', description: 'Sumbangan warga untuk gotong royong', debit: 400000, credit: 0, category: 'Pemasukan' },
    { date: '2024-05-10', description: 'Saldo 2024', debit: 0, credit: 0, category: 'Saldo' },
  ];

  // Calculate running balance
  const initialBalance = 2275000;
  let runningBalance = initialBalance;

  for (const t of transactions) {
    runningBalance += t.debit - t.credit;
    await prisma.transaction.create({
      data: {
        date: new Date(t.date),
        description: t.description,
        debit: t.debit,
        credit: t.credit,
        balance: runningBalance,
        category: t.category,
        createdBy: admin.id,
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log(`Admin: ${admin.email} / admin123`);
  console.log(`Manager: ${manager.email} / manager123`);
  console.log(`Public: ${publicUser.email} / public123`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
