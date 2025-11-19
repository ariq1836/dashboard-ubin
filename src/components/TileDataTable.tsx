
import React, { useState, useMemo } from 'react';
import type { TileData } from '../types';

type SortConfig = {
  key: keyof TileData;
  direction: 'ascending' | 'descending';
} | null;

interface TileDataTableProps {
    data: TileData[];
    onDelete: (tile: TileData) => void;
}

const ITEMS_PER_PAGE = 10;

const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | 'none' }> = ({ direction }) => {
    if (direction === 'ascending') return <span className="ml-1">▲</span>;
    if (direction === 'descending') return <span className="ml-1">▼</span>;
    return <span className="ml-1 text-gray-400">↕</span>;
};

export const TileDataTable: React.FC<TileDataTableProps> = ({ data, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleDeleteClick = (tile: TileData) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data ubin merek "${tile.brand}" dari lokasi "${tile.lokasiSampel}"?`)) {
            setDeletingId(tile.id);
            onDelete(tile);
            // Reset deleting status handled by parent re-render usually, but we can timeout safely
            setTimeout(() => setDeletingId(null), 5000); 
        }
    };

    const headers: { key: keyof TileData; label: string }[] = [
        { key: 'entryDate', label: 'Tgl Masuk' },
        { key: 'brand', label: 'Merek' },
        { key: 'manufacturer', label: 'Perusahaan' },
        { key: 'grade', label: 'Grade' },
        { key: 'workingSize', label: 'Working Size' },
        { key: 'finish', label: 'GL/UGL' },
        { key: 'lokasiSampel', label: 'Lokasi'},
        { key: 'status', label: 'Status' },
    ];
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {headers.map(({ key, label }) => (
                            <th key={key as string} scope="col" className="px-6 py-3 cursor-pointer whitespace-nowrap" onClick={() => requestSort(key)}>
                                <div className="flex items-center">
                                    {label}
                                    <SortIcon direction={sortConfig?.key === key ? sortConfig.direction : 'none'} />
                                </div>
                            </th>
                        ))}
                        <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((tile) => (
                        <tr key={tile.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{tile.entryDate}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{tile.brand}</td>
                            <td className="px-6 py-4">{tile.manufacturer}</td>
                            <td className="px-6 py-4">{tile.grade}</td>
                            <td className="px-6 py-4">{tile.workingSize}</td>
                            <td className="px-6 py-4">{tile.finish}</td>
                            <td className="px-6 py-4 font-mono text-indigo-600">{tile.lokasiSampel}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    tile.status === 'Sampel Aktif' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {tile.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleDeleteClick(tile)}
                                    disabled={deletingId === tile.id}
                                    className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    title="Hapus Data"
                                >
                                    {deletingId === tile.id ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {paginatedData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Tidak ada data yang ditampilkan.
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            Prev
                        </button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
