import React, { useMemo } from 'react';
import type { TileData } from '../types';

interface StorageMapProps {
  data: TileData[];
  onTileClick?: (tile: TileData) => void;
}

export const StorageMap: React.FC<StorageMapProps> = ({ data, onTileClick }) => {
  // Mengelompokkan data berdasarkan Lokasi Sampel
  const groupedData = useMemo(() => {
    const groups: Record<string, TileData[]> = {};
    data.forEach(tile => {
      const loc = tile.lokasiSampel.trim() || 'Tidak Ada Lokasi';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(tile);
    });
    return groups;
  }, [data]);

  const locations = Object.keys(groupedData).sort();

  if (locations.length === 0) {
      return <div className="p-8 text-center text-gray-500">Belum ada data lokasi sampel yang tersedia.</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m0 4h5m0 0v-4m0 4h5m0 0v-4m0 4h5" />
        </svg>
        Denah Penyimpanan Sampel
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {locations.map(location => (
          <div key={location} className="border rounded-lg overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
              <span className="font-bold text-indigo-900 truncate" title={location}>{location}</span>
              <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                {groupedData[location].length} Item
              </span>
            </div>
            <div className="p-3 bg-gray-50 flex-grow space-y-2 overflow-y-auto max-h-64">
              {groupedData[location].map(tile => (
                <div 
                  key={tile.id} 
                  onClick={() => onTileClick && onTileClick(tile)}
                  className={`p-2 rounded border text-sm cursor-pointer hover:bg-white transition-colors ${
                    tile.status === 'Sampel Aktif' 
                    ? 'bg-white border-green-200 hover:border-green-400' 
                    : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  <div className="font-medium text-gray-800 truncate">{tile.brand}</div>
                  <div className="text-xs text-gray-500 flex justify-between">
                     <span>{tile.workingSize}</span>
                     <span className={tile.status === 'Sampel Aktif' ? 'text-green-600' : 'text-gray-400'}>
                        {tile.grade}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
