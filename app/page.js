'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  X, 
  Download,
  Image as ImageIcon,
  Maximize2,
  Bug,
  RefreshCw,
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
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    type: 'bug',
    image: null
  });

  const fileInputRef = useRef(null);

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
    console.log('Fetching fresh changelog...');
    
    // Tambah timestamp untuk bypass cache
    const timestamp = Date.now();
    const response = await fetch(`/api/changelog?_=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0',
        'Pragma': 'no-cache'
      },
      cache: 'no-store' // Important!
    });
    
    const result = await response.json();
    console.log('Changelog result:', result);
    
    if (result.data && result.data !== 'Belum ada changelog') {
      setChangelog(result.data);
    } else {
      setChangelog('Belum ada changelog');
    }
    
    // Set debug info
    setDebugInfo({
      ...result,
      fetchTime: new Date().toISOString(),
      itemCount: result.debug?.totalItems || 0
    });
    
  } catch (error) {
    console.error('Error fetching changelog:', error);
    setChangelog('Error loading changelog');
  }
};

  useEffect(() => {
    fetchData();
    fetchChangelog();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = e.target.elements.name.value.trim();
    if (!name) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (response.ok) {
        e.target.reset();
        fetchData();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category_id) {
      alert('Judul dan kategori harus diisi');
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
        fetchData();
        fetchChangelog();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Hapus item
const handleDeleteItem = async (itemId) => {
  if (!confirm('Yakin ingin menghapus item ini?')) return;
  
  try {
    // Tampilkan loading
    setDeletingItem(itemId);
    
    await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    // Refresh SEMUA data
    await Promise.all([
      fetchData(),
      fetchChangelog() // Pastikan changelog juga refresh
    ]);
    
    // Show success message
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

// Update status
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
      // Jika status berubah ke/from 'done', refresh changelog
      await Promise.all([
        fetchData(),
        fetchChangelog() // Refresh changelog
      ]);
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
};

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Hapus kategori akan menghapus semua item di dalamnya. Yakin?')) return;
    
    try {
      await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      fetchData();
      fetchChangelog();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      setFormData({ ...formData, image: file });
    }
  };

  const downloadChangelog = () => {
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

  const getFilteredItems = () => {
    if (activeTab === 'all') return items;
    return items.filter(item => item.type === activeTab);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getTypeLabel = (type) => {
    const labels = {
      bug: 'Bug',
      feature_update: 'Featre Update',
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
      belum: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      proses: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Load data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <header className="border-b">
        <div className="max-w-7xl mx- auto px-4 py-4">
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
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Tambah Kategori</h2>
              <form onSubmit={handleAddCategory}>
                <div className="space-y-3">
                  <input
                    name="name"
                    placeholder="Nama kategori"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Tambah Kategori
                  </button>
                </div>
              </form>
            </div>

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

          <div className="lg:col-span-3">
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
                      {tab === 'all' ? 'Semua' : getTypeLabel(tab)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

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
                                <option value="belum">Belum</option>
                                <option value="proses">Proses</option>
                                <option value="done">Selesai</option>
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