'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  X, 
  Download,
  Image as ImageIcon,
  Maximize2,
  Plus
} from 'lucide-react';
import { useTheme } from './theme-provider';

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showImagePreview, setShowImagePreview] = useState(null);
  const [changelog, setChangelog] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [loadingChangelog, setLoadingChangelog] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    type: 'bug',
    image: null
  });

  const fileInputRef = useRef(null);

  // ============ FUNGSI UTAMA ============
  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/items')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const itemsData = await itemsRes.json();
      
      setCategories(categoriesData.data || []);
      setItems(itemsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangelog = async () => {
    try {
      setLoadingChangelog(true);
      const timestamp = Date.now();
      const response = await fetch(`/api/changelog?_=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const result = await response.json();
      
      if (result.data && result.data !== 'Belum ada changelog') {
        setChangelog(result.data);
      } else {
        setChangelog('Belum ada changelog');
      }
    } catch (error) {
      console.error('Error fetching changelog:', error);
      setChangelog('Error loading changelog');
    } finally {
      setLoadingChangelog(false);
    }
  };

  // ============ USE EFFECT ============
  useEffect(() => {
    // HAPUS bagian supabase real-time karena tidak didefinisikan
    // Atau jika ingin pakai, import supabase dulu
    // Untuk sekarang, cukup load data awal saja
    
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchData(),
          fetchChangelog()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      console.log('Component cleanup');
    };
  }, []);

  // ============ HANDLERS ============
  // FIX: Tambah fungsi handleAddCategory yang hilang
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    
    if (!name || !name.trim()) {
      setShowToast({
        message: 'Nama kategori harus diisi',
        type: 'error'
      });
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      
      if (response.ok) {
        form.reset();
        await Promise.all([
          fetchData(),
          fetchChangelog()
        ]);
        setShowToast({
          message: 'Adding new categories success',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setShowToast({
        message: 'Failed to add new categories',
        type: 'error'
      });
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category_id) {
      setShowToast({
        message: 'Judul dan kategori harus diisi',
        type: 'error'
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('category_id', formData.category_id);
    formDataToSend.append('type', formData.type);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        body: formDataToSend
      });
      
      if (response.ok) {
        setFormData({ title: '', category_id: '', type: 'bug', image: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        await Promise.all([
          fetchData(),
          fetchChangelog()
        ]);
        setShowToast({
          message: 'Adding new item success',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setShowToast({
        message: 'Failed to add new item',
        type: 'error'
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    
    try {
      setDeletingItem(itemId);
      
      await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      await Promise.all([
        fetchData(),
        fetchChangelog()
      ]);
      
      setShowToast({
        message: 'Item berhasil dihapus',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting item:', error);
      setShowToast({
        message: 'Gagal menghapus item',
        type: 'error'
      });
    } finally {
      setDeletingItem(null);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await Promise.all([
          fetchData(),
          fetchChangelog()
        ]);
        setShowToast({
          message: `Status berhasil diubah ke "${newStatus}"`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setShowToast({
        message: 'Gagal mengubah status',
        type: 'error'
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Hapus kategori akan menghapus semua item di dalamnya. Yakin?')) return;
    
    try {
      await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      await Promise.all([
        fetchData(),
        fetchChangelog()
      ]);
      setShowToast({
        message: 'Kategori berhasil dihapus',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      setShowToast({
        message: 'Gagal menghapus kategori',
        type: 'error'
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setShowToast({
          message: 'Ukuran file maksimal 5MB',
          type: 'error'
        });
        return;
      }
      setFormData({ ...formData, image: file });
    }
  };

  const downloadChangelog = () => {
    if (!changelog || changelog === 'Belum ada changelog') {
      setShowToast({
        message: 'Tidak ada changelog untuk diunduh',
        type: 'error'
      });
      return;
    }
    
    const blob = new Blob([changelog], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `changelog-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getFilteredItems = () => {
    if (activeTab === 'all') return items;
    return items.filter(item => item.type === activeTab);
  };

  const getTypeLabel = (type) => {
    const labels = {
      bug: 'Bug',
      feature_update: 'Feature Update',
      new_feature: 'Feature Add'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      bug: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      feature_update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      new_feature: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      process: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Load data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Image Preview Modal */}
      {showImagePreview && (
        <div 
          className="image-preview-container"
          onClick={() => setShowImagePreview(null)}
        >
          <div className="image-preview-content" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setShowImagePreview(null)}
            >
              <X size={24} />
            </button>
            <img src={showImagePreview} alt="Preview" />
          </div>
        </div>
      )}

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Changelog</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadChangelog}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => setShowChangelog(false)}
                  className="px-3 py-1 border rounded hover:bg-secondary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {changelog || 'Tidak ada changelog'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification - DIPINDAHKAN ke luar modal */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {showToast.type === 'success' ? '✓' : '✗'}
            <span>{showToast.message}</span>
            <button 
              onClick={() => setShowToast(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading untuk changelog */}
      {loadingChangelog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Loading changelog...</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading untuk delete */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              <span>Deleting item...</span>
            </div>
          </div>
        </div>
      )}

      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4"> {/* FIX: mx- auto menjadi mx-auto */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Wishlist Manager</h1>
              <p className="text-sm text-muted-foreground">
                Bug, Feature Add, Changes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChangelog(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                <Download size={16} />
                Changelog
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border hover:bg-secondary"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Kiri */}
          <div className="space-y-6">
            {/* Form Tambah Kategori */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Categories</h2>
              <form onSubmit={handleAddCategory}>
                <div className="space-y-3">
                  <input
                    name="name"
                    placeholder="Name"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Add Categories
                  </button>
                </div>
              </form>
            </div>

            {/* Form Tambah Item */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
              <form onSubmit={handleAddItem}>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['bug', 'feature_update', 'new_feature'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`py-2 rounded-lg text-sm ${
                          formData.type === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {getTypeLabel(type)}
                      </button>
                    ))}
                  </div>

                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={
                      formData.type === 'bug' ? 'Bug Description...' :
                      formData.type === 'feature_update' ? 'Update Description...' :
                      'Feature Description...'
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />

                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon size={16} />
                      Upload Gambar (Opsional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm"
                    />
                    {formData.image && (
                      <div className="text-xs text-muted-foreground">
                        {formData.image.name}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
              </form>
            </div>

            {/* Daftar Kategori */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Categories ({categories.length})</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-secondary rounded">
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-sm text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Konten Utama */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-card border rounded-lg mb-6">
              <div className="flex border-b">
                {['all', 'bug', 'feature_update', 'new_feature'].map((tab) => {
                  const count = tab === 'all' 
                    ? items.length 
                    : items.filter(item => item.type === tab).length;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-center font-medium ${
                        activeTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'all' ? 'All' : getTypeLabel(tab)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daftar Items */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {activeTab === 'all' ? 'Item List' : getTypeLabel(activeTab)}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Total: {getFilteredItems().length} item
                </div>
              </div>

              {getFilteredItems().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">Belum ada item</p>
                  <p className="text-sm">Tambahkan item pertama</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredItems().map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-lg mb-1">{item.title}</h3>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={`px-3 py-1 rounded-full text-sm ${getTypeColor(item.type)}`}>
                                  {getTypeLabel(item.type)}
                                </span>
                                <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                                  {item.categories?.name || 'Tanpa kategori'}
                                </span>
                              </div>
                            </div>
                            
                            {item.image_url && (
                              <button
                                onClick={() => setShowImagePreview(item.image_url)}
                                className="ml-2 p-2 text-primary hover:text-primary/80"
                                title="Lihat gambar"
                              >
                                <Maximize2 size={18} />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between">
                            <div className="flex items-center gap-3">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}
                              >
                                <option value="belum">Pending</option>
                                <option value="proses">Process</option>
                                <option value="done">Done/fixed</option>
                              </select>
                              <span className="text-sm text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}