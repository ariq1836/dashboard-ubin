import React, { useState, useMemo } from 'react';
import type { TileData } from '../types';

type SortConfig = {
  key: keyof TileData;
  direction: 'ascending' | 'descending';
} | null;

interface TileDataTableProps {
    data: TileData[];
}

const ITEMS_PER_PAGE = 10;

const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | 'none' }> = ({ direction }) => {
    if (direction === 'ascending') return <span className="ml-1">▲</span>;
    if (direction === 'descending') return <span className="ml-1">▼</span>;
    return <span className="ml-1 text-gray-400">↕</span>;
};

export const TileDataTable: React.FC<TileDataTableProps> = ({ data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key: keyof TileData) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedData, currentPage]);
    
    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const headers: { key: keyof TileData; label: string }[] = [
        { key: 'entryDate', label: 'Tgl Masuk' },
        { key: 'brand', label: 'Merek' },
        { key: 'manufacturer', label: 'Perusahaan' },
        { key: 'grade', label: 'Grade' },
        { key: 'workingSize', label: 'Working Size' },
        { key: 'finish', label: 'GL/UGL' },
        { key: 'type', label: 'Tipe' },
        { key: 'lokasiSampel', label: 'Lokasi Sampel'},
        { key: 'status', label: 'Status' },
    ];
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {headers.map(({ key, label }) => (
                            <th key={key} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(key)}>
                                <div className="flex items-center">
                                    {label}
                                    <SortIcon direction={sortConfig?.key === key ? sortConfig.direction : 'none'} />
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((tile) => (
                        <tr key={tile.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{tile.entryDate}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{tile.brand}</td>
                            <td className="px-6 py-4">{tile.manufacturer}</td>
                            <td className="px-6 py-4">{tile.grade}</td>
                            <td className="px-6 py-4">{tile.workingSize}</td>
                            <td className="px-6 py-4">{tile.finish}</td>
                            <td className="px-6 py-4">{tile.type}</td>
                            <td className="px-6 py-4">{tile.lokasiSampel}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    tile.status === 'Sampel Aktif' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {tile.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {paginatedData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Tidak ada hasil yang cocok dengan kriteria filter Anda.
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            Sebelumnya
                        </button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            Berikutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};