import React, { useState, useEffect, useMemo } from 'react';
import { fetchTileData, saveTileData, deleteTileData } from './services/googleSheetService';
import type { TileData } from './types';
import { DashboardCharts } from './components/Charts';
import { TileDataTable } from './components/TileDataTable';
import { StorageMap } from './components/StorageMap';

// --- Helper & Sub-components ---

const Header: React.FC = () => (
  <header className="bg-slate-800 shadow-md sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold text-white flex items-center">
        <svg className="w-8 h-8 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
        Tile Monitor
      </h1>
    </div>
  </header>
);

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}
const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass = "text-indigo-600 bg-indigo-100" }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transform transition hover:scale-105 duration-200">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
    <div className={`${colorClass} p-3 rounded-full`}>
      {icon}
    </div>
  </div>
);

interface FilterControlsProps {
  filters: { search: string; grade: string; status: string; };
  onFilterChange: (name: string, value: string) => void;
  uniqueGrades: string[];
  uniqueStatuses: string[];
  onAddNew: () => void;
}
const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, uniqueGrades, uniqueStatuses, onAddNew }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-20 z-10 border-t-4 border-indigo-500">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input type="text" value={filters.search} onChange={(e) => onFilterChange('search', e.target.value)} placeholder="Cari merek, produsen..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div className="md:col-span-2">
        <select value={filters.grade} onChange={(e) => onFilterChange('grade', e.target.value)} className="w-full py-2 px-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">Semua Grade</option>
          {uniqueGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <select value={filters.status} onChange={(e) => onFilterChange('status', e.target.value)} className="w-full py-2 px-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">Semua Status</option>
          {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      <div className="md:col-span-3">
        <button onClick={onAddNew} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Tambah Ubin
        </button>
      </div>
    </div>
  </div>
);

// --- Modal Component ---
interface AddTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTile: Omit<TileData, 'id'>) => Promise<void>;
}
const AddTileModal: React.FC<AddTileModalProps> = ({ isOpen, onClose, onSave }) => {
    const initialState = {
        entryDate: new Date().toISOString().split('T')[0], brand: '', manufacturer: '',
        grade: 'BIa', workingSize: '', finish: 'GL', type: 'Rectified',
        lokasiSampel: '', status: 'Sampel Aktif'
    };
    const [newTile, setNewTile] = useState(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSave(newTile);
        setIsSubmitting(false);
        setNewTile(initialState);
    };

    const isFormValid = newTile.brand && newTile.manufacturer && newTile.workingSize && newTile.lokasiSampel;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Tambah Data Ubin Baru</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Tanggal Masuk" name="entryDate" type="date" value={newTile.entryDate} onChange={handleChange} required />
                            <InputField label="Merek Ubin" name="brand" value={newTile.brand} onChange={handleChange} placeholder="Contoh: Brand A" required />
                            <InputField label="Perusahaan Produsen" name="manufacturer" value={newTile.manufacturer} onChange={handleChange} placeholder="Contoh: PT. Keramik Jaya" required />
                            <InputField label="Working Size" name="workingSize" value={newTile.workingSize} onChange={handleChange} placeholder="Contoh: 60x60 cm" required />
                            <SelectField label="Grade" name="grade" value={newTile.grade} onChange={handleChange} options={['BIa', 'BIb', 'BIIa', 'BIIb', 'BIII']} />
                            <SelectField label="GL/UGL" name="finish" value={newTile.finish} onChange={handleChange} options={['GL', 'UGL']} />
                            <SelectField label="Tipe" name="type" value={newTile.type} onChange={handleChange} options={['Rectified', 'Non-Rectified']} />
                            <InputField label="Lokasi Sampel" name="lokasiSampel" value={newTile.lokasiSampel} onChange={handleChange} placeholder="Contoh: Rak A-01" required />
                            <SelectField label="Status" name="status" value={newTile.status} onChange={handleChange} options={['Sampel Aktif', 'Sampel Nonaktif']} />
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-end space-x-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium shadow-sm">Batal</button>
                        <button type="submit" disabled={!isFormValid || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center font-medium shadow-sm">
                            {isSubmitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const InputField = ({ label, ...props }) => (<div className="flex flex-col"><label className="mb-1 text-sm font-semibold text-gray-700">{label}</label><input className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" {...props} /></div>);
const SelectField = ({ label, options, ...props }) => (<div className="flex flex-col"><label className="mb-1 text-sm font-semibold text-gray-700">{label}</label><select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none bg-white" {...props}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);

// --- Toast Notification ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => (
    <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-2xl text-white flex items-center z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-bounce-in`}>
        <span className="font-medium">{message}</span>
        <button onClick={onDismiss} className="ml-4 font-bold opacity-80 hover:opacity-100">&times;</button>
    </div>
);

// --- Main App Component ---
function App() {
  const [allTiles, setAllTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', grade: '', status: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // State untuk Switch Tab View
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true); setError(null);
        const data = await fetchTileData();
        setAllTiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const handleSaveTile = async (newTileData: Omit<TileData, 'id'>) => {
      try {
          const savedTile = await saveTileData(newTileData);
          setAllTiles(prev => [savedTile, ...prev]);
          setIsModalOpen(false);
          showToast('Data ubin berhasil disimpan!', 'success');
      } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal menyimpan data.';
          showToast(message, 'error');
      }
  };

  const handleDeleteTile = async (tile: TileData) => {
      try {
          // Update optimistik UI
          const previousTiles = [...allTiles];
          setAllTiles(prev => prev.filter(t => t.id !== tile.id));

          await deleteTileData(tile);
          showToast('Data berhasil dihapus', 'success');
      } catch (err) {
          // Rollback jika gagal
          const message = err instanceof Error ? err.message : 'Gagal menghapus data.';
          showToast(message, 'error');
          // Reload data to sync
          const data = await fetchTileData();
          setAllTiles(data);
      }
  };

  const filteredTiles = useMemo(() => {
    return allTiles.filter(tile => {
      const searchLower = filters.search.toLowerCase();
      return (
        (filters.grade === '' || tile.grade === filters.grade) &&
        (filters.status === '' || tile.status === filters.status) &&
        (tile.brand.toLowerCase().includes(searchLower) || tile.manufacturer.toLowerCase().includes(searchLower) || tile.lokasiSampel.toLowerCase().includes(searchLower))
      );
    });
  }, [allTiles, filters]);

  const dashboardMetrics = useMemo(() => ({
    total: allTiles.length,
    brands: new Set(allTiles.map(t => t.brand)).size,
    activeSamples: allTiles.filter(t => t.status === 'Sampel Aktif').length,
  }), [allTiles]);

  const uniqueFilterOptions = useMemo(() => ({
    uniqueGrades: [...new Set(allTiles.map(t => t.grade))].sort(),
    uniqueStatuses: [...new Set(allTiles.map(t => t.status))].sort(),
  }), [allTiles]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="text-center"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600 font-medium">Sinkronisasi data...</p></div></div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-red-50"><div className="text-center p-8 bg-white shadow-xl rounded-xl max-w-md"><h2 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2><p className="text-gray-600 mb-6">{error}</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md">Muat Ulang</button></div></div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard title="Total Jenis Ubin" value={dashboardMetrics.total} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} colorClass="text-blue-600 bg-blue-100" />
          <DashboardCard title="Merek Unik" value={dashboardMetrics.brands} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m0 4h5m0 0v-4m0 4h5m0 0v-4m0 4h5" /></svg>} colorClass="text-purple-600 bg-purple-100" />
          <DashboardCard title="Sampel Aktif" value={dashboardMetrics.activeSamples} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="text-green-600 bg-green-100" />
        </div>
        
        {/* Charts Area */}
        <div className="mb-8 transform transition hover:scale-[1.01] duration-300"><DashboardCharts data={filteredTiles} /></div>
        
        {/* Filter & Action Area */}
        <FilterControls filters={filters} onFilterChange={handleFilterChange} uniqueGrades={uniqueFilterOptions.uniqueGrades} uniqueStatuses={uniqueFilterOptions.uniqueStatuses} onAddNew={() => setIsModalOpen(true)} />
        
        {/* Tabs for View Mode */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setViewMode('list')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${viewMode === 'list' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Tabel Data
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${viewMode === 'map' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Denah Penyimpanan
            </button>
          </nav>
        </div>

        {/* Data Display Content */}
        <div className="transition-opacity duration-300 ease-in-out">
          {viewMode === 'list' ? (
            <TileDataTable data={filteredTiles} onDelete={handleDeleteTile} />
          ) : (
            <StorageMap data={filteredTiles} />
          )}
        </div>

      </main>
      
      <AddTileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTile} />
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default App;
