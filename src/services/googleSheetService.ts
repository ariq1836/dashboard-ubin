
import { TileData } from '../types';

// URL untuk mengambil data CSV dari Google Sheet
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14-ZggYhORtlQOp2e4Xp2fONWKBAdf_p_4LyCSU1tpKs/gviz/tq?tqx=out:csv&sheet=Sheet1';

// --- PENTING! ---
// Ganti URL di bawah ini dengan URL Web App dari Google Apps Script yang telah Anda deploy.
// Pastikan Anda sudah melakukan "New Deployment" jika Anda mengubah kode di Apps Script.
const SAVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2jKMrrzhBaYazBr2UD5Aj9xM-F9QiF2vDwi5opPNe3uOAgX07VhyRnKVrKwh7EU3qRg/exec';

export const fetchTileData = async (): Promise<TileData[]> => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Gagal mengambil data: ${response.statusText}`);
    }
    const text = await response.text();
    
    const dataRows = text.trim().split('\n').slice(1);
    
    const data: TileData[] = dataRows.map((row, index) => {
      const cleanedRow = row.startsWith('"') && row.endsWith('"') ? row.slice(1, -1) : row;
      // Regex untuk split CSV yang lebih aman menangani koma dalam kutipan jika ada
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
        lokasiSampel: columns[7] || '',
        status: columns[8] || '',
      };
    }).filter(tile => tile.brand && tile.entryDate);

    return data;
  } catch (error) {
    console.error("Error fetching or parsing tile data:", error);
    throw new Error('Tidak dapat memuat atau memproses data dari Google Sheet.');
  }
};

export const saveTileData = async (tileData: Omit<TileData, 'id'>): Promise<TileData> => {
  return sendToScript({ ...tileData, action: 'add' });
};

export const deleteTileData = async (tileData: TileData): Promise<void> => {
  await sendToScript({ ...tileData, action: 'delete' });
};

// Fungsi umum untuk mengirim data ke Apps Script
const sendToScript = async (data: any): Promise<any> => {
  try {
    const response = await fetch(SAVE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if(result.status === 'success') {
      return {
        ...data,
        id: `tile-${new Date().getTime()}`, // ID sementara untuk UI
      };
    } else {
      throw new Error(result.message || 'Terjadi kesalahan pada script server.');
    }
  } catch (error) {
    console.error("Error communicating with Google Script:", error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Koneksi ke server gagal. Pastikan URL Web App benar dan akses script diset ke "Anyone".');
    }
    throw new Error(`Gagal memproses data. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
};
