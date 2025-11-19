import { TileData } from '../types';

// URL untuk mengambil data CSV dari Google Sheet
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14-ZggYhORtlQOp2e4Xp2fONWKBAdf_p_4LyCSU1tpKs/gviz/tq?tqx=out:csv&sheet=Sheet1';

// --- PENTING! ---
// Ganti URL di bawah ini dengan URL Web App dari Google Apps Script yang telah Anda deploy.
// Tanpa URL yang benar, fungsi penyimpanan data TIDAK AKAN BEKERJA.
const SAVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx5d5GMRavrx43AzY98sajIbrie0pHfth_-MclfOKmWXNNzS7JNewY51LMp2Qh6lCF35w/exec';


export const fetchTileData = async (): Promise<TileData[]> => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Gagal mengambil data: ${response.statusText}`);
    }
    const text = await response.text();
    
    const dataRows = text.trim().split('\n').slice(1);
    
    const data: TileData[] = dataRows.map((row, index) => {
      // Baris data sekarang memiliki 9 kolom dengan "Lokasi Sampel"
      const cleanedRow = row.startsWith('"') && row.endsWith('"') ? row.slice(1, -1) : row;
      const columns = cleanedRow.split('","');

      return {
        id: `tile-${index}`,
        entryDate: columns[0] || '',
        brand: columns[1] || '',
        manufacturer: columns[2] || '',
        grade: columns[3] || '',
        workingSize: columns[4] || '',
        finish: columns[5] || '',
        type: columns[6] || '',
        lokasiSampel: columns[7] || '', // Kolom baru ditambahkan di sini
        status: columns[8] || '',
      };
    }).filter(tile => tile.brand && tile.entryDate); // Filter baris kosong

    return data;
  } catch (error) {
    console.error("Error fetching or parsing tile data:", error);
    throw new Error('Tidak dapat memuat atau memproses data dari Google Sheet.');
  }
};

/**
 * Menyimpan data ubin baru ke Google Sheet menggunakan Google Apps Script.
 * Pastikan Anda telah mengganti `SAVE_SCRIPT_URL` dengan URL Web App Anda yang valid.
 */
export const saveTileData = async (tileData: Omit<TileData, 'id'>): Promise<TileData> => {
  try {
    // Mengirim data ke Google Apps Script.
    // 'Content-Type': 'text/plain' digunakan untuk menghindari permintaan preflight CORS,
    // yang seringkali menjadi masalah saat berinteraksi dengan Web Apps dari Apps Script.
    // Apps Script masih bisa mem-parsing body JSON string dengan benar.
    const response = await fetch(SAVE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(tileData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    if(result.status === 'success') {
      // Data berhasil disimpan, kembalikan data asli dengan ID baru untuk pembaruan UI
      return {
        ...tileData,
        id: `tile-${new Date().getTime()}`,
      };
    } else {
      // Tangkap pesan error dari Apps Script
      throw new Error(result.message || 'Terjadi kesalahan pada script server.');
    }
  } catch (error) {
    console.error("Error saving tile data:", error);
    // FIX: Memberikan pesan error yang lebih spesifik untuk "Failed to fetch"
    // Ini membantu pengguna mendiagnosis masalah umum terkait CORS dan konfigurasi Apps Script.
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Koneksi ke server gagal (Failed to fetch). Ini sering disebabkan oleh masalah CORS atau kesalahan konfigurasi pada Google Apps Script. Pastikan URL Web App Anda benar dan telah disebarkan dengan akses "Anyone".');
    }
    throw new Error(`Tidak dapat menyimpan data ke Google Sheet. Error: ${error.message}`);
  }
};